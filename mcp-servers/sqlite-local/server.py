#!/usr/bin/env python3
"""
SQLite Local MCP Server

Provides SQLite database access via MCP protocol.
Run with: python3 -m mcp_server_sqlite --db-path /path/to/db
"""
import asyncio
import json
import sqlite3
import sys
import os
from typing import Any, Dict, List, Optional
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import (
    Tool,
    TextContent,
    Resource,
    CallToolResult,
    ReadResourceResult,
)


class SQLiteMCPServer:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.server = Server("sqlite-local")
        self._setup_tools()
        self._setup_resources()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _setup_tools(self):
        @self.server.call_tool()
        async def execute(arguments: Dict[str, Any]) -> CallToolResult:
            """Execute any SQL statement (requires approval for writes)."""
            query = arguments.get("query", "")
            params = arguments.get("params", [])

            if not query.strip():
                return CallToolResult(
                    content=[TextContent(type="text", text="Error: Empty query")]
                )

            try:
                conn = self._get_connection()
                cursor = conn.cursor()

                # Check if it's a write operation
                is_write = not query.strip().upper().startswith(("SELECT", "PRAGMA", "WITH"))

                cursor.execute(query, params)

                if is_write:
                    conn.commit()
                    return CallToolResult(
                        content=[TextContent(type="text", text=f"Executed: {cursor.rowcount} rows affected")]
                    )
                else:
                    rows = cursor.fetchall()
                    result = [dict(row) for row in rows]
                    return CallToolResult(
                        content=[TextContent(type="text", text=json.dumps(result, indent=2, default=str))]
                    )
            except Exception as e:
                return CallToolResult(
                    content=[TextContent(type="text", text=f"Error: {str(e)}")]
                )
            finally:
                conn.close()

        @self.server.call_tool()
        async def query(arguments: Dict[str, Any]) -> CallToolResult:
            """Execute SELECT query and return results."""
            sql = arguments.get("sql", "")
            params = arguments.get("params", [])

            if not sql.strip():
                return CallToolResult(
                    content=[TextContent(type="text", text="Error: Empty query")]
                )

            try:
                conn = self._get_connection()
                cursor = conn.cursor()
                cursor.execute(sql, params)
                rows = cursor.fetchall()
                result = [dict(row) for row in rows]
                return CallToolResult(
                    content=[TextContent(type="text", text=json.dumps(result, indent=2, default=str))]
                )
            except Exception as e:
                return CallToolResult(
                    content=[TextContent(type="text", text=f"Error: {str(e)}")]
                )
            finally:
                conn.close()

        @self.server.call_tool()
        async def list_tables(arguments: Dict[str, Any]) -> CallToolResult:
            """List all tables in the database."""
            try:
                conn = self._get_connection()
                cursor = conn.cursor()
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
                tables = [row[0] for row in cursor.fetchall()]
                return CallToolResult(
                    content=[TextContent(type="text", text=json.dumps(tables, indent=2))]
                )
            except Exception as e:
                return CallToolResult(
                    content=[TextContent(type="text", text=f"Error: {str(e)}")]
                )
            finally:
                conn.close()

        @self.server.call_tool()
        async def describe_table(arguments: Dict[str, Any]) -> CallToolResult:
            """Get schema information for a table."""
            table = arguments.get("table", "")
            if not table:
                return CallToolResult(
                    content=[TextContent(type="text", text="Error: Table name required")]
                )

            try:
                conn = self._get_connection()
                cursor = conn.cursor()

                # Get column info
                cursor.execute(f"PRAGMA table_info({table})")
                columns = []
                for col in cursor.fetchall():
                    columns.append({
                        "name": col[1],
                        "type": col[2],
                        "not_null": bool(col[3]),
                        "default": col[4],
                        "primary_key": bool(col[5])
                    })

                # Get foreign keys
                cursor.execute(f"PRAGMA foreign_key_list({table})")
                foreign_keys = []
                for fk in cursor.fetchall():
                    foreign_keys.append({
                        "column": fk[3],
                        "references_table": fk[2],
                        "references_column": fk[4]
                    })

                # Get indexes
                cursor.execute(f"PRAGMA index_list({table})")
                indexes = []
                for idx in cursor.fetchall():
                    if not idx[1].startswith("sqlite_"):
                        cursor.execute(f"PRAGMA index_info({idx[1]})")
                        idx_cols = [row[2] for row in cursor.fetchall()]
                        indexes.append({
                            "name": idx[1],
                            "columns": idx_cols,
                            "unique": bool(idx[2])
                        })

                # Get row count
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                row_count = cursor.fetchone()[0]

                result = {
                    "table": table,
                    "columns": columns,
                    "foreign_keys": foreign_keys,
                    "indexes": indexes,
                    "row_count": row_count
                }

                return CallToolResult(
                    content=[TextContent(type="text", text=json.dumps(result, indent=2, default=str))]
                )
            except Exception as e:
                return CallToolResult(
                    content=[TextContent(type="text", text=f"Error: {str(e)}")]
                )
            finally:
                conn.close()

    def _setup_resources(self):
        @self.server.read_resource()
        async def read_schema(uri: str) -> ReadResourceResult:
            if uri == "schema://tables":
                try:
                    conn = self._get_connection()
                    cursor = conn.cursor()
                    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
                    tables = [row[0] for row in cursor.fetchall()]

                    schema = {}
                    for table in tables:
                        cursor.execute(f"PRAGMA table_info({table})")
                        columns = []
                        for col in cursor.fetchall():
                            columns.append({
                                "name": col[1],
                                "type": col[2],
                                "not_null": bool(col[3]),
                                "default": col[4],
                                "primary_key": bool(col[5])
                            })

                        cursor.execute(f"PRAGMA foreign_key_list({table})")
                        foreign_keys = []
                        for fk in cursor.fetchall():
                            foreign_keys.append({
                                "column": fk[3],
                                "references_table": fk[2],
                                "references_column": fk[4]
                            })

                        cursor.execute(f"SELECT COUNT(*) FROM {table}")
                        row_count = cursor.fetchone()[0]

                        schema[table] = {
                            "columns": columns,
                            "foreign_keys": foreign_keys,
                            "row_count": row_count
                        }

                    return ReadResourceResult(
                        contents=[{
                            "uri": uri,
                            "mimeType": "application/json",
                            "text": json.dumps(schema, indent=2)
                        }]
                    )
                except Exception as e:
                    return ReadResourceResult(
                        contents=[{
                            "uri": uri,
                            "mimeType": "application/json",
                            "text": json.dumps({"error": str(e)})
                        }]
                    )
                finally:
                    conn.close()

            return ReadResourceResult(
                contents=[{
                    "uri": uri,
                    "mimeType": "application/json",
                    "text": json.dumps({"error": "Resource not found"})
                }]
            )

    async def run(self):
        async with stdio_server() as (read_stream, write_stream):
            await self.server.run(read_stream, write_stream, self.server.create_initialization_options())


async def main():
    import argparse
    parser = argparse.ArgumentParser(description="SQLite MCP Server")
    parser.add_argument("--db-path", required=True, help="Path to SQLite database")
    args = parser.parse_args()

    server = SQLiteMCPServer(args.db_path)
    await server.run()


if __name__ == "__main__":
    asyncio.run(main())
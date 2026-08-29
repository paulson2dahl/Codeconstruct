import React from 'react';
import { Database, Table, Columns, Key, Link2, Search, ChevronDown, Download, RefreshCw } from 'lucide-react';
import './SchemaExplorer.css';

export const SchemaExplorer = () => {
  const [schema, setSchema] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [selectedTable, setSelectedTable] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');

  const discoverSchema = async () => {
    setLoading(true);
    try {
      // Mock schema data - in real implementation, call sandbox discover_schema.py
      const mockSchema = {
        database: '/sandbox/user_data.db',
        tables: {
          students: {
            columns: [
              { name: 'student_id', type: 'INTEGER', not_null: 1, primary_key: 1 },
              { name: 'name', type: 'TEXT', not_null: 1 },
              { name: 'email', type: 'TEXT', not_null: 0 },
              { name: 'class_id', type: 'INTEGER', not_null: 1 },
              { name: 'enrollment_date', type: 'TEXT', not_null: 1 },
            ],
            primary_keys: ['student_id'],
            foreign_keys: [{ column: 'class_id', references_table: 'classes', references_column: 'class_id' }],
            row_count: 150,
            sample_data: [{ student_id: 1, name: 'John Doe', email: 'john@school.edu', class_id: 8, enrollment_date: '2024-01-15' }]
          },
          classes: {
            columns: [
              { name: 'class_id', type: 'INTEGER', not_null: 1, primary_key: 1 },
              { name: 'name', type: 'TEXT', not_null: 1 },
              { name: 'teacher_id', type: 'INTEGER', not_null: 1 },
              { name: 'room', type: 'TEXT', not_null: 0 },
              { name: 'schedule', type: 'TEXT', not_null: 0 },
            ],
            primary_keys: ['class_id'],
            foreign_keys: [{ column: 'teacher_id', references_table: 'teachers', references_column: 'teacher_id' }],
            row_count: 12,
            sample_data: [{ class_id: 8, name: 'Class 8A', teacher_id: 3, room: 'Room 101', schedule: 'Mon-Fri 8:00-15:00' }]
          },
          teachers: {
            columns: [
              { name: 'teacher_id', type: 'INTEGER', not_null: 1, primary_key: 1 },
              { name: 'name', type: 'TEXT', not_null: 1 },
              { name: 'subject', type: 'TEXT', not_null: 1 },
              { name: 'email', type: 'TEXT', not_null: 0 },
              { name: 'hire_date', type: 'TEXT', not_null: 1 },
            ],
            primary_keys: ['teacher_id'],
            foreign_keys: [],
            row_count: 25,
            sample_data: [{ teacher_id: 3, name: 'Ms. Smith', subject: 'Mathematics', email: 'smith@school.edu', hire_date: '2020-08-01' }]
          },
          marks: {
            columns: [
              { name: 'mark_id', type: 'INTEGER', not_null: 1, primary_key: 1 },
              { name: 'student_id', type: 'INTEGER', not_null: 1 },
              { name: 'subject', type: 'TEXT', not_null: 1 },
              { name: 'exam_type', type: 'TEXT', not_null: 1 },
              { name: 'marks', type: 'INTEGER', not_null: 1 },
              { name: 'max_marks', type: 'INTEGER', not_null: 1 },
              { name: 'date', type: 'TEXT', not_null: 1 },
            ],
            primary_keys: ['mark_id'],
            foreign_keys: [{ column: 'student_id', references_table: 'students', references_column: 'student_id' }],
            row_count: 1200,
            sample_data: [{ mark_id: 1, student_id: 1, subject: 'Math', exam_type: 'Midterm', marks: 85, max_marks: 100, date: '2024-10-15' }]
          },
        },
        relationships: [
          { from_table: 'students', from_column: 'class_id', to_table: 'classes', to_column: 'class_id' },
          { from_table: 'classes', from_column: 'teacher_id', to_table: 'teachers', to_column: 'teacher_id' },
          { from_table: 'marks', from_column: 'student_id', to_table: 'students', to_column: 'student_id' },
        ],
        indexes: []
      };
      setSchema(mockSchema);
    } catch (err) {
      console.error('Schema discovery failed:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    discoverSchema();
  }, []);

  const tables = schema?.tables || {};
  const tableNames = Object.keys(tables);
  const filteredTables = tableNames.filter(name =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="tf-schema-explorer">
      <div className="tf-schema-header">
        <div className="tf-schema-title">
          <Database size={24} />
          <h1>Schema Explorer</h1>
        </div>
        <div className="tf-schema-actions">
          <button className="tf-btn secondary" onClick={discoverSchema} disabled={loading}>
            <RefreshCw size={16} /> {loading ? 'Discovering...' : 'Discover Schema'}
          </button>
          <button className="tf-btn primary">
            <Download size={16} /> Export Schema
          </button>
        </div>
      </div>

      <div className="tf-schema-body">
        <aside className="tf-schema-sidebar">
          <div className="tf-schema-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search tables..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="tf-tables-list">
            {filteredTables.map(tableName => {
              const table = tables[tableName];
              const isSelected = selectedTable === tableName;
              return (
                <button
                  key={tableName}
                  className={`tf-table-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedTable(isSelected ? null : tableName)}
                >
                  <div className="tf-table-item-header">
                    <Table size={16} />
                    <span className="tf-table-name">{tableName}</span>
                    <span className="tf-table-count">{table.row_count} rows</span>
                  </div>
                  <div className="tf-table-item-meta">
                    {table.primary_keys.length > 0 && (
                      <span className="tf-table-badge pk" title="Primary Key">
                        <Key size={10} /> PK
                      </span>
                    )}
                    {table.foreign_keys.length > 0 && (
                      <span className="tf-table-badge fk" title="Foreign Keys">
                        <Link2 size={10} /> {table.foreign_keys.length} FK
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
            {filteredTables.length === 0 && (
              <div className="tf-tables-empty">No tables found</div>
            )}
          </div>
        </aside>

        <main className="tf-schema-main">
          {selectedTable && tables[selectedTable] ? (
            <TableDetail table={tables[selectedTable]} tableName={selectedTable} />
          ) : (
            <div className="tf-schema-welcome">
              <Table size={64} />
              <h2>Select a table to explore</h2>
              <p>Click on a table in the sidebar to view its columns, relationships, and sample data</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const TableDetail = ({ table, tableName }: { table: any; tableName: string }) => {
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
    columns: true,
    relationships: true,
    sample: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="tf-table-detail">
      <div className="tf-table-detail-header">
        <div>
          <h2>{tableName}</h2>
          <p className="tf-table-desc">{table.row_count} rows • {table.columns.length} columns</p>
        </div>
      </div>

      <div className="tf-detail-sections">
        <DetailSection
          title="Columns"
          icon={<Columns size={16} />}
          expanded={expandedSections.columns}
          onToggle={() => toggleSection('columns')}
        >
          <div className="tf-columns-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Null</th>
                  <th>Key</th>
                  <th>Default</th>
                </tr>
              </thead>
              <tbody>
                {table.columns.map((col: any, idx: number) => (
                  <tr key={idx}>
                    <td><code>{col.name}</code></td>
                    <td><span className="tf-type-badge">{col.type}</span></td>
                    <td>{col.not_null ? 'NO' : 'YES'}</td>
                    <td>
                      {col.primary_key && <span className="tf-key-badge pk"><Key size={12} /> PK</span>}
                      {table.foreign_keys.some((fk: any) => fk.column === col.name) && (
                        <span className="tf-key-badge fk"><Link2 size={12} /> FK</span>
                      )}
                    </td>
                    <td>{col.default ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DetailSection>

        <DetailSection
          title="Relationships"
          icon={<Link2 size={16} />}
          expanded={expandedSections.relationships}
          onToggle={() => toggleSection('relationships')}
        >
          {table.foreign_keys.length > 0 ? (
            <ul className="tf-relationships-list">
              {table.foreign_keys.map((fk: any, idx: number) => (
                <li key={idx} className="tf-relationship-item">
                  <span className="tf-rel-from"><code>{fk.column}</code></span>
                  <span className="tf-rel-arrow">→</span>
                  <span className="tf-rel-to"><code>{fk.references_table}.{fk.references_column}</code></span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="tf-no-data">No foreign key relationships</p>
          )}
        </DetailSection>

        <DetailSection
          title="Sample Data"
          icon={<Database size={16} />}
          expanded={expandedSections.sample}
          onToggle={() => toggleSection('sample')}
        >
          {table.sample_data && table.sample_data.length > 0 ? (
            <div className="tf-sample-table">
              <table>
                <thead>
                  <tr>
                    {table.columns.map((col: any) => <th key={col.name}>{col.name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {table.sample_data.map((row: any, idx: number) => (
                    <tr key={idx}>
                      {table.columns.map((col: any) => (
                        <td key={col.name}>{row[col.name] ?? '—'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="tf-no-data">No sample data available</p>
          )}
        </DetailSection>
      </div>
    </div>
  );
};

const DetailSection = ({ title, icon, expanded, onToggle, children }: {
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) => (
  <div className="tf-detail-section">
    <div className="tf-detail-section-header" onClick={onToggle}>
      <div className="tf-detail-section-title">
        {icon}
        <span>{title}</span>
      </div>
      <ChevronDown size={16} className={expanded ? 'expanded' : ''} />
    </div>
    {expanded && <div className="tf-detail-section-content">{children}</div>}
  </div>
);
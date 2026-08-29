#!/usr/bin/env python3
"""
solve_matching.py — Generic constraint solving / matching / optimization.

Runs in TrueForge sandbox (Code Mode).
Uses OR-Tools for assignment, scheduling, allocation problems.
"""
import sqlite3
import json
import sys
import os
from typing import Dict, List, Any, Optional


def resolve_db(db_path: str) -> str:
    if db_path and os.path.exists(db_path):
        return db_path
    possible = ["/sandbox/user_data.db", os.path.join(os.getcwd(), "user_data.db")]
    for p in possible:
        if os.path.exists(p):
            return p
    return os.path.join(os.getcwd(), "user_data.db")


def solve_assignment(db_path: str, request: Dict[str, Any]) -> Dict[str, Any]:
    """
    Solve assignment problem: assign agents to tasks.
    Request: {
        "agents_table": "teachers",
        "agents_id": "teacher_id",
        "tasks_table": "classes",
        "tasks_id": "class_id",
        "cost_table": "teacher_class_cost",
        "cost_agent_col": "teacher_id",
        "cost_task_col": "class_id",
        "cost_col": "cost",
        "max_assignments_per_agent": 1,
        "max_assignments_per_task": 1
    }
    """
    try:
        from ortools.linear_solver import pywraplp
    except ImportError:
        return {"error": "OR-Tools not installed. Run: pip install ortools"}

    agents_table = request.get("agents_table")
    agents_id = request.get("agents_id")
    tasks_table = request.get("tasks_table")
    tasks_id = request.get("tasks_id")
    cost_table = request.get("cost_table")
    cost_agent_col = request.get("cost_agent_col")
    cost_task_col = request.get("cost_task_col")
    cost_col = request.get("cost_col", "cost")
    max_per_agent = request.get("max_assignments_per_agent", 1)
    max_per_task = request.get("max_assignments_per_task", 1)

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Get agents
    cursor.execute(f"SELECT {agents_id} FROM {agents_table}")
    agents = [row[0] for row in cursor.fetchall()]

    # Get tasks
    cursor.execute(f"SELECT {tasks_id} FROM {tasks_table}")
    tasks = [row[0] for row in cursor.fetchall()]

    # Get costs
    cursor.execute(f"""
        SELECT {cost_agent_col}, {cost_task_col}, {cost_col}
        FROM {cost_table}
        WHERE {cost_agent_col} IS NOT NULL AND {cost_task_col} IS NOT NULL
    """)
    costs = {(row[0], row[1]): row[2] for row in cursor.fetchall()}
    conn.close()

    if not agents or not tasks:
        return {"error": "No agents or tasks found"}

    # Create solver
    solver = pywraplp.Solver.CreateSolver('SAT')
    if not solver:
        return {"error": "Could not create SAT solver"}

    # Decision variables
    x = {}
    for a in agents:
        for t in tasks:
            if (a, t) in costs:
                x[(a, t)] = solver.BoolVar(f'x_{a}_{t}')

    # Objective
    solver.Minimize(solver.Sum(costs[(a, t)] * x[(a, t)] for (a, t) in x))

    # Constraints
    for a in agents:
        solver.Add(solver.Sum(x[(a, t)] for t in tasks if (a, t) in x) <= max_per_agent)

    for t in tasks:
        solver.Add(solver.Sum(x[(a, t)] for a in agents if (a, t) in x) <= max_per_task)

    # Solve
    status = solver.Solve()

    if status == pywraplp.Solver.OPTIMAL or status == pywraplp.Solver.FEASIBLE:
        assignments = []
        total_cost = 0
        for (a, t), var in x.items():
            if var.solution_value() > 0.5:
                assignments.append({
                    "agent_id": a,
                    "task_id": t,
                    "cost": costs[(a, t)]
                })
                total_cost += costs[(a, t)]

        return {
            "status": "optimal" if status == pywraplp.Solver.OPTIMAL else "feasible",
            "assignments": assignments,
            "total_cost": total_cost,
            "unassigned_agents": [a for a in agents if all(var.solution_value() < 0.5 for (aa, tt), var in x.items() if aa == a)],
            "unassigned_tasks": [t for t in tasks if all(var.solution_value() < 0.5 for (aa, tt), var in x.items() if tt == t)]
        }
    else:
        return {"status": "infeasible", "message": "No solution found"}


def solve_scheduling(db_path: str, request: Dict[str, Any]) -> Dict[str, Any]:
    """
    Solve scheduling problem: assign resources to time slots.
    Request: {
        "resources_table": "teachers",
        "resources_id": "teacher_id",
        "slots_table": "time_slots",
        "slots_id": "slot_id",
        "availability_table": "teacher_availability",
        "avail_resource_col": "teacher_id",
        "avail_slot_col": "slot_id",
        "demand_table": "class_schedule",
        "demand_slot_col": "slot_id",
        "demand_resource_col": "teacher_id"
    }
    """
    try:
        from ortools.sat.python import cp_model
    except ImportError:
        return {"error": "OR-Tools CP-SAT not installed. Run: pip install ortools"}

    resources_table = request.get("resources_table")
    resources_id = request.get("resources_id")
    slots_table = request.get("slots_table")
    slots_id = request.get("slots_id")
    availability_table = request.get("availability_table")
    avail_resource_col = request.get("avail_resource_col")
    avail_slot_col = request.get("avail_slot_col")
    demand_table = request.get("demand_table")
    demand_slot_col = request.get("demand_slot_col")
    demand_resource_col = request.get("demand_resource_col")

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Get resources
    cursor.execute(f"SELECT {resources_id} FROM {resources_table}")
    resources = [row[0] for row in cursor.fetchall()]

    # Get slots
    cursor.execute(f"SELECT {slots_id} FROM {slots_table}")
    slots = [row[0] for row in cursor.fetchall()]

    # Get availability
    cursor.execute(f"SELECT {avail_resource_col}, {avail_slot_col} FROM {availability_table}")
    available = {(row[0], row[1]) for row in cursor.fetchall()}

    # Get demand
    cursor.execute(f"SELECT {demand_slot_col}, {demand_resource_col} FROM {demand_table}")
    demand = [(row[0], row[1]) for row in cursor.fetchall()]
    conn.close()

    model = cp_model.CpModel()

    # Variables: assign[resource][slot] = 1 if resource assigned to slot
    assign = {}
    for r in resources:
        for s in slots:
            if (r, s) in available:
                assign[(r, s)] = model.NewBoolVar(f'assign_{r}_{s}')

    # Each demand must be satisfied
    for slot, resource in demand:
        if (resource, slot) in assign:
            model.Add(assign[(resource, slot)] == 1)

    # Each resource at most one slot per time (if slots are time-based)
    # This is a simplification - real scheduling needs more constraints

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 30
    status = solver.Solve(model)

    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        schedule = []
        for (r, s), var in assign.items():
            if solver.Value(var) == 1:
                schedule.append({"resource_id": r, "slot_id": s})

        return {
            "status": "optimal" if status == cp_model.OPTIMAL else "feasible",
            "schedule": schedule
        }
    else:
        return {"status": "infeasible", "message": "No feasible schedule found"}


def solve_allocation(db_path: str, request: Dict[str, Any]) -> Dict[str, Any]:
    """
    Solve resource allocation: distribute limited resources to competing demands.
    Request: {
        "resources_table": "budgets",
        "resource_id": "dept_id",
        "resource_amount_col": "budget",
        "demands_table": "project_requests",
        "demand_id": "project_id",
        "demand_amount_col": "requested_amount",
        "demand_priority_col": "priority",
        "allocate_proportionally": true
    }
    """
    resources_table = request.get("resources_table")
    resource_id = request.get("resource_id")
    resource_amount_col = request.get("resource_amount_col")
    demands_table = request.get("demands_table")
    demand_id = request.get("demand_id")
    demand_amount_col = request.get("demand_amount_col")
    demand_priority_col = request.get("demand_priority_col", "priority")
    proportional = request.get("allocate_proportionally", True)

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute(f"SELECT {resource_id}, {resource_amount_col} FROM {resources_table}")
    resources = {row[0]: row[1] for row in cursor.fetchall()}

    cursor.execute(f"SELECT {demand_id}, {demand_amount_col}, {demand_priority_col} FROM {demands_table} ORDER BY {demand_priority_col} DESC")
    demands = [{"id": row[0], "amount": row[1], "priority": row[2]} for row in cursor.fetchall()]
    conn.close()

    if proportional:
        # Proportional allocation
        total_requested = sum(d["amount"] for d in demands)
        allocations = {}

        for resource, available in resources.items():
            if total_requested <= available:
                for d in demands:
                    allocations[(resource, d["id"])] = d["amount"]
            else:
                for d in demands:
                    alloc = d["amount"] * available / total_requested
                    allocations[(resource, d["id"])] = round(alloc, 2)
    else:
        # Priority-based allocation (greedy)
        allocations = {}
        for resource, available in resources.items():
            remaining = available
            for d in demands:
                alloc = min(d["amount"], remaining)
                allocations[(resource, d["id"])] = alloc
                remaining -= alloc
                if remaining <= 0:
                    break

    result_allocations = [
        {"resource_id": r, "demand_id": d, "allocated": v}
        for (r, d), v in allocations.items() if v > 0
    ]

    return {
        "allocations": result_allocations,
        "unmet_demands": [
            {"demand_id": d["id"], "requested": d["amount"], "allocated": sum(v for (r, dd), v in allocations.items() if dd == d["id"])}
            for d in demands
        ]
    }


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: solve_matching.py '<json_request>'"}))
        sys.exit(1)

    try:
        request = json.loads(sys.argv[1])
    except json.JSONDecodeError:
        print(json.dumps({"error": "Invalid JSON request"}))
        sys.exit(1)

    action = request.get("action")
    db_path = request.get("db_path", "")
    db_path = resolve_db(db_path)

    if action == "assignment":
        result = solve_assignment(db_path, request)
    elif action == "scheduling":
        result = solve_scheduling(db_path, request)
    elif action == "allocation":
        result = solve_allocation(db_path, request)
    else:
        result = {"error": f"Unknown action: {action}"}

    print(json.dumps(result, indent=2, default=str))


if __name__ == "__main__":
    main()
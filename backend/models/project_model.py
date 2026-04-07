"""
project_model.py  –  MongoDB-backed CRUD for the projects collection.
"""

from datetime import datetime
from database import get_db, get_next_id
from ai_engine.allocator import build_project_analysis
from models.employee_model import EmployeeModel


def _doc_to_dict(doc: dict | None) -> dict | None:
    if doc is None:
        return None
    d = dict(doc)
    d.pop('_id', None)
    d['tech'] = list(d.get('tech', []))
    d['assignedEmployees'] = list(d.get('assignedEmployees', []))
    d['tasks'] = list(d.get('tasks', []))
    d['milestones'] = list(d.get('milestones', []))
    d.setdefault('teamSize', 1)
    d.setdefault('completion', 0)
    d.setdefault('budget', 0)
    d.setdefault('spent', 0)
    d.setdefault('priority', 'Medium')
    d.setdefault('status', 'Pending')
    d.setdefault('riskLevel', 'Medium')
    d.setdefault('icon', '📁')
    d.setdefault('color', '#e63946')
    return d


def _analysis_payload(data: dict):
    employees = EmployeeModel.get_all()
    if not employees:
        return {}
    result = build_project_analysis(employees, data, data.get('tech', []))
    return {
        'aiSummary': result.get('analysis', {}).get('summary', ''),
        'riskLevel': result.get('analysis', {}).get('deliveryRisk', 'Medium'),
        'recommendedLead': result.get('lead', {}).get('name', ''),
        'assignedEmployees': [m.get('name') for m in result.get('recommendedTeam', [])],
        'workloadInsights': result.get('analysis', {}),
        'allocationSnapshot': result,
    }


class ProjectModel:
    @staticmethod
    def get_all() -> list[dict]:
        db = get_db()
        docs = db.projects.find({}, {'_id': 0}).sort('id', 1)
        return [_doc_to_dict(d) for d in docs]

    @staticmethod
    def get_by_id(project_id: int) -> dict | None:
        db = get_db()
        doc = db.projects.find_one({'id': int(project_id)}, {'_id': 0})
        return _doc_to_dict(doc)

    @staticmethod
    def create(data: dict) -> dict:
        db = get_db()
        new_id = get_next_id('projects')
        now = datetime.utcnow().isoformat()
        base = {
            'id': new_id,
            'name': data['name'],
            'head': data.get('head', ''),
            'status': data.get('status', 'Pending'),
            'priority': data.get('priority', 'Medium'),
            'tech': list(data.get('tech', [])),
            'completion': int(data.get('completion', data.get('progress', 0))),
            'teamSize': int(data.get('teamSize', data.get('team_size', 1))),
            'deadline': data.get('deadline', data.get('endDate', '')),
            'startDate': data.get('startDate', data.get('start_date', '')),
            'description': data.get('description', ''),
            'budget': float(data.get('budget', 0) or 0),
            'spent': float(data.get('spent', 0) or 0),
            'assignedEmployees': list(data.get('assignedEmployees', data.get('assigned_employees', []))),
            'tasks': list(data.get('tasks', [])),
            'milestones': list(data.get('milestones', [])),
            'icon': data.get('icon', '📁'),
            'color': data.get('color', '#e63946'),
            'createdAt': now,
        }
        base.update(_analysis_payload(base))
        db.projects.insert_one(base)
        return ProjectModel.get_by_id(new_id)

    @staticmethod
    def update(project_id: int, data: dict) -> dict | None:
        project = ProjectModel.get_by_id(project_id)
        if not project:
            return None
        merged = {**project, **data}
        update_doc = {
            'name': merged['name'],
            'head': merged.get('head', ''),
            'status': merged.get('status', 'Pending'),
            'priority': merged.get('priority', 'Medium'),
            'tech': list(merged.get('tech', [])),
            'completion': int(merged.get('completion', merged.get('progress', 0))),
            'teamSize': int(merged.get('teamSize', merged.get('team_size', 1))),
            'deadline': merged.get('deadline', merged.get('endDate', '')),
            'startDate': merged.get('startDate', merged.get('start_date', '')),
            'description': merged.get('description', ''),
            'budget': float(merged.get('budget', 0) or 0),
            'spent': float(merged.get('spent', 0) or 0),
            'assignedEmployees': list(merged.get('assignedEmployees', merged.get('assigned_employees', []))),
            'tasks': list(merged.get('tasks', [])),
            'milestones': list(merged.get('milestones', [])),
            'icon': merged.get('icon', '📁'),
            'color': merged.get('color', '#e63946'),
        }
        update_doc.update(_analysis_payload(update_doc))
        db = get_db()
        db.projects.update_one({'id': int(project_id)}, {'$set': update_doc})
        return ProjectModel.get_by_id(project_id)

    @staticmethod
    def delete(project_id: int) -> bool:
        db = get_db()
        db.projects.delete_one({'id': int(project_id)})
        return True

    @staticmethod
    def get_analysis(project_id: int) -> dict | None:
        project = ProjectModel.get_by_id(project_id)
        if not project:
            return None
        employees = EmployeeModel.get_all()
        return build_project_analysis(employees, project, project.get('tech', []))

    @staticmethod
    def get_stats() -> dict:
        projects = ProjectModel.get_all()
        total = len(projects)
        active = sum(1 for p in projects if p.get('status') in {'Active', 'In Progress'})
        pending = sum(1 for p in projects if p.get('status') in {'Pending', 'Planning'})
        review = sum(1 for p in projects if p.get('status') == 'Review')
        completed = sum(1 for p in projects if p.get('status') == 'Completed')
        avg_comp = round(sum(int(p.get('completion', 0) or 0) for p in projects) / total) if total else 0
        return {'total': total, 'active': active, 'pending': pending, 'review': review, 'completed': completed, 'avgCompletion': avg_comp}

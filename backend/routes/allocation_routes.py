from datetime import datetime

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from models.employee_model import EmployeeModel
from models.project_model import ProjectModel
from ai_engine.allocator import run_allocation
from database import get_db, get_next_id

allocation_bp = Blueprint('allocation', __name__, url_prefix='/api/allocation')


@allocation_bp.route('/run', methods=['POST'])
@jwt_required()
def run():
    body = request.get_json() or {}
    project_id = body.get('projectId')
    required_skills = body.get('requiredSkills', [])
    project_name = body.get('projectName', '')

    project = ProjectModel.get_by_id(project_id) if project_id else None
    if project_name and project is None:
        project = {'name': project_name, 'tech': required_skills, 'teamSize': body.get('teamSize', 3)}
    employees = EmployeeModel.get_all()

    if not employees:
        return jsonify({'success': False, 'message': 'No employees found in database'}), 404

    result = run_allocation(employees, project, required_skills)

    if result.get('best') and (project or project_name):
        best = result['best']
        proj_id = (project or {}).get('id', 0)
        proj_name = (project or {}).get('name', project_name or 'Ad-hoc Allocation')
        now = datetime.utcnow()
        try:
            db = get_db()
            new_id = get_next_id('allocations')
            db.allocations.insert_one({
                'id': new_id,
                'project_id': proj_id,
                'project': proj_name,
                'employee_id': best['id'],
                'employee': best['name'],
                'score': best['matchScore'],
                'status': 'Accepted',
                'date': now.strftime('%Y-%m-%d'),
                'allocatedAt': now.isoformat(),
                'team': [m.get('name') for m in result.get('recommendedTeam', [])],
                'summary': result.get('analysis', {}).get('summary', ''),
            })
        except Exception:
            pass

    return jsonify(result)


@allocation_bp.route('/history', methods=['GET'])
@jwt_required()
def history():
    db = get_db()
    records = list(db.allocations.find({}, {'_id': 0}).sort('allocatedAt', -1).limit(50))
    return jsonify(records)

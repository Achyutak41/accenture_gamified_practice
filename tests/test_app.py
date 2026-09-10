from app import create_app
from maze import reachable, rotate
def test_agents_and_session_flow():
 c=create_app().test_client(); agents=c.get('/api/v1/agents').get_json()['agents']; assert len(agents)==9
 for agent in agents:
  made=c.post('/api/v1/sessions',json={'agent':agent['slug'],'difficulty':'easy'}); assert made.status_code==201
  sid=made.get_json()['session_id']; assert c.post(f'/api/v1/sessions/{sid}/start').status_code==200
  assert c.get(f'/api/v1/sessions/{sid}/question').status_code==200
def test_maze_rotation_and_reachability():
 assert rotate(2)==4
 assert reachable([[2,12],[0,0]],[0,0],[0,1])

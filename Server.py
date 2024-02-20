from xmlrpc.server import SimpleXMLRPCServer


doctors = {
    '1': {'name': 'Dr. Alice', 'schedule': ['9:00', '11:00', '15:00']},
    '2': {'name': 'Dr. Bob', 'schedule': ['10:00', '12:00', '14:00']},
}

appointments = []

def list_doctors():
    return [{ 'id': doc_id, 'name': doctors[doc_id]['name'] } for doc_id in doctors]

def get_schedule(doctor_id):
    if doctor_id in doctors:
        return doctors[doctor_id]['schedule']
    else:
        return "Doctor not found."

def make_appointment(doctor_id, appointment_time):
    if doctor_id in doctors and appointment_time in doctors[doctor_id]['schedule']:
        # 假设一个预约时间只能被预约一次
        doctors[doctor_id]['schedule'].remove(appointment_time)
        appointment = {'doctor_id': doctor_id, 'time': appointment_time}
        appointments.append(appointment)
        return "Appointment made successfully."
    else:
        return "Appointment failed. Time slot may be unavailable."

server = SimpleXMLRPCServer(('localhost', 8000), allow_none=True)
print("Listening on port 8000...")

server.register_function(list_doctors, 'list_doctors')
server.register_function(get_schedule, 'get_schedule')
server.register_function(make_appointment, 'make_appointment')

try:
    server.serve_forever()
except KeyboardInterrupt:
    print("Exiting.")

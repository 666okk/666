import xmlrpc.client


server_url = 'http://localhost:8000'
proxy = xmlrpc.client.ServerProxy(server_url)

def list_doctors():
    print("Fetching list of doctors...")
    return proxy.list_doctors()

def get_schedule(doctor_id):
    print(f"Fetching schedule for Doctor {doctor_id}...")
    return proxy.get_schedule(doctor_id)

def make_appointment(doctor_id, appointment_time):
    print(f"Making appointment with Doctor {doctor_id} at {appointment_time}...")
    return proxy.make_appointment(doctor_id, appointment_time)


def main():
    while True:
        print("1. List doctors\n2. View Schedule\n3. Make Appointment\n4. Exit")
        choice = input("Choose an option: ")

        if choice == '1':
            doctors = list_doctors()
            for doc in doctors:
                print(f"Doctor ID: {doc['id']}, Name: {doc['name']}")
                
        elif choice == '2':
            doc_id = input("Enter Doctor ID: ")
            schedule = get_schedule(doc_id)
            print(schedule)
            
        elif choice == '3':
            doc_id = input("Enter Doctor ID: ")
            time = input("Enter desired time for appointment: ")
            result = make_appointment(doc_id, time)
            print(result)
            
        elif choice == '4':
            print("Exiting...")
            break
        else:
            print("Invalid option. Please try again.")

if __name__ == "__main__":
    main()

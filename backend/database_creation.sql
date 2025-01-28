
DROP TABLE IF EXISTS profile_person_map, invoices, accounts, person_records, profiles, medical_aid_plans, medical_aids, employers, service_centers, service_centers_list, ref_clients, ref_clients_list, clients_logs, logs, user_feature, features, clients, users, user_feature_access, user_client_access;

-- Create users table
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(512) NOT NULL,
    first VARCHAR(255),
    last VARCHAR(255),
    address VARCHAR(255),
    tell_nr VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create clients table
CREATE TABLE clients (
    client_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(512) NOT NULL,
    first VARCHAR(255),
    last VARCHAR(255),
    registration_nr VARCHAR(255),
    practice_nr VARCHAR(255),
    tell_nr VARCHAR(20),
    client_type ENUM('Specialist', 'Anaesthetist', 'Surgeon') DEFAULT 'Anaesthetist',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create user_client_access table
CREATE TABLE user_client_access (
    user_client_access_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    client_id INT,
    permissions ENUM('View', 'Edit', 'Delete') DEFAULT 'View',
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE SET NULL
);

-- Create features table
CREATE TABLE features (
    feature_id INT AUTO_INCREMENT PRIMARY KEY,
    feature_name VARCHAR(255)
);

-- Create user_feature_access 
CREATE TABLE user_feature_access (
    user_feature_access_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    feature_id INT,
    is_active BOOLEAN DEFAULT FALSE,
    permissions ENUM('View', 'Edit', 'Delete') DEFAULT 'View',
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (feature_id) REFERENCES features(feature_id) ON DELETE SET NULL
);

-- client_features inc or client_feature_access


-- Create logs table
CREATE TABLE logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(255),
    old_value JSON,
    new_value JSON,
    target_table VARCHAR(255),
    target_id INT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Create clients_logs table
CREATE TABLE clients_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT,
    action VARCHAR(255),
    old_value JSON,
    new_value JSON,
    target_table VARCHAR(255),
    target_id INT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE SET NULL
);

-- Create ref_clients_list table
CREATE TABLE ref_clients_list (
    ref_client_list_id INT AUTO_INCREMENT PRIMARY KEY,
    first VARCHAR(255),
    last VARCHAR(255),
    practice_nr VARCHAR(255) UNIQUE
);

-- Create ref_clients table
CREATE TABLE ref_clients (
    ref_client_id INT AUTO_INCREMENT PRIMARY KEY,
    ref_client_list_id INT,
    client_id INT,
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE SET NULL,
    FOREIGN KEY (ref_client_list_id) REFERENCES ref_clients_list(ref_client_list_id) ON DELETE SET NULL
);

-- Create service_centers_list table
CREATE TABLE service_centers_list (
    service_center_list_id INT AUTO_INCREMENT PRIMARY KEY,
    service_center_name VARCHAR(255),
    service_center_type ENUM('Hospital', 'Rooms') DEFAULT 'Hospital'
);

-- Create service_centers table
CREATE TABLE service_centers (
    service_center_id INT AUTO_INCREMENT PRIMARY KEY,
    service_center_list_id INT,
    client_id INT,
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE SET NULL,
    FOREIGN KEY (service_center_list_id) REFERENCES service_centers_list(service_center_list_id) ON DELETE SET NULL
);

-- Create employers table
CREATE TABLE employers (
    employer_id INT AUTO_INCREMENT PRIMARY KEY,
    employer_name VARCHAR(255),
    employer_tel VARCHAR(255),
    emp_post_address VARCHAR(255),
    emp_str_address VARCHAR(255),
    emp_reg_nr VARCHAR(255) UNIQUE
);

-- Create medical_aids table
CREATE TABLE medical_aids (
    medical_aid_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) UNIQUE
);

-- Create medical_aid_plans table
CREATE TABLE medical_aid_plans (
    plan_id INT AUTO_INCREMENT PRIMARY KEY,
    medical_aid_id INT,
    plan_name VARCHAR(255),
    plan_code VARCHAR(255),
    FOREIGN KEY (medical_aid_id) REFERENCES medical_aids(medical_aid_id) ON DELETE SET NULL
);

-- Create profiles table
CREATE TABLE profiles (
    profile_id INT AUTO_INCREMENT PRIMARY KEY,
    medical_aid_id INT,
    plan_id INT,
    medical_aid_nr VARCHAR(255) UNIQUE,
    authorization_nr VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (medical_aid_id) REFERENCES medical_aids(medical_aid_id) ON DELETE SET NULL,
    FOREIGN KEY (plan_id) REFERENCES medical_aid_plans(plan_id) ON DELETE SET NULL
);

-- Create person_records table
CREATE TABLE person_records (
    person_id INT AUTO_INCREMENT PRIMARY KEY,
    first VARCHAR(255),
    last VARCHAR(255),
    title ENUM('Mr', 'Mrs', 'Miss', 'Ms', 'Dr') DEFAULT NULL,
    date_of_birth DATE, 
    gender ENUM('M', 'F') DEFAULT NULL,
    id_type ENUM('Passport', 'SA ID', 'Other') DEFAULT NULL,
    id_nr VARCHAR(255) UNIQUE,
    cell_nr VARCHAR(20),
    tell_nr VARCHAR(20),
    work_nr VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE addresses (
    address_id INT AUTO_INCREMENT PRIMARY KEY,
    person_id INT NOT NULL,
    address_type ENUM('Postal', 'Street', 'Other') DEFAULT 'Other',
    is_domicilium BOOLEAN DEFAULT FALSE,
    line1 VARCHAR(255) NOT NULL,
    line2 VARCHAR(255),
    line3 VARCHAR(255),
    line4 VARCHAR(255),
    postal_code VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (person_id) REFERENCES person_records(person_id) ON DELETE CASCADE
);

-- Create profile_person_map table
CREATE TABLE profile_person_map (
    map_id INT AUTO_INCREMENT PRIMARY KEY,
    profile_id INT,
    person_id INT,
    is_main_member boolean,
    dependent_nr INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (profile_id) REFERENCES profiles(profile_id) ON DELETE SET NULL,
    FOREIGN KEY (person_id) REFERENCES person_records(person_id) ON DELETE SET NULL
);

-- Create accounts table
CREATE TABLE accounts (
    account_id INT AUTO_INCREMENT PRIMARY KEY,
    profile_id INT,
    client_id INT,
    main_member_id INT NULL,
    patient_id INT NULL,
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE SET NULL,
    FOREIGN KEY (profile_id) REFERENCES profiles(profile_id) ON DELETE SET NULL,
    FOREIGN KEY (main_member_id) REFERENCES person_records(person_id) ON DELETE SET NULL,
    FOREIGN KEY (patient_id) REFERENCES person_records(person_id) ON DELETE SET NULL
);

-- Create invoices table
CREATE TABLE invoices (
    invoice_id INT AUTO_INCREMENT PRIMARY KEY,
    account_id INT,
    profile_id INT,
    date_of_service DATE,
    status ENUM('Processing', 'Billed', 'Archived') DEFAULT 'Processing',
    patient_snapshot JSON,
    member_snapshot JSON,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE SET NULL,
    FOREIGN KEY (profile_id) REFERENCES profiles(profile_id) ON DELETE SET NULL
);



-- Inserting sample data for users
INSERT INTO users (email, password, first, last, address, tell_nr)
VALUES 
('user1@example.com', 'password_hash_1', 'John', 'Doe', '123 Main St', '123-456-7890'),
('user2@example.com', 'password_hash_2', 'Jane', 'Smith', '456 Elm St', '987-654-3210');

-- Inserting sample data for clients
INSERT INTO clients (email, password, first, last, registration_nr, practice_nr, tell_nr, client_type)
VALUES 
('client1@email.com', 'test', 'van der Wolt', 'James', 'REG1234', '21515151', '012-222-3333', 'Surgeon'),
('client2@email.com', 'test', 'Lievenberg', 'Alicia', 'REG5678', '21235151', '012-555-6666', 'Specialist'),
('client1@email.com', 'test', 'Bellings', 'Sando', 'REG1234', '21775151', '012-222-3333', 'Anaesthetist'),

-- Inserting sample data for medical aids
INSERT INTO medical_aids (name)
VALUES 
('Discovery'),
('Medihelp'),
('Gems'),
('Momentum'),
('Bonitas');

-- Inserting sample data for medical aid plans
INSERT INTO medical_aid_plans (medical_aid_id, plan_name, plan_code)
VALUES 
(1, 'Classic Saver', 'CLASAVE2911'),
(2, 'MediBonus', 'MEDI1001'),
(3, 'Emerald', 'EME2312'),
(4, 'Basic', 'MOM001'),
(5, 'BonClassic', 'BONCLA0054');

-- Inserting sample data for profiles
INSERT INTO profiles (medical_aid_id, plan_id, medical_aid_nr, authorization_nr, is_active)
VALUES 
(1, 1, '91672345', '701666', TRUE),
(2, 2, '42125516', '801666', TRUE),
(3, 3, '74577457', '901666', TRUE),
(4, 4, 'FW515212', '1001666', TRUE),
(3, 3, '74566457', '4684681', TRUE);

-- Inserting sample data for person_records
INSERT INTO person_records (first, last, title, date_of_birth, gender, id_nr, cell_nr, tell_nr, email)
VALUES 
('Thabo', 'Mokoena', 'Mr', '1990-05-15', 'M', '9005150000000', '082-111-2222', '011-333-4444', 'thabo@mokoena.co.za'),
('Naledi', 'Mokoena', 'Mrs', '1992-04-12', 'F', '9204120000000', '082-111-2223', '011-333-4445', 'naledi@mokoena.co.za'),
('Lerato', 'Mokoena', 'Miss', '2010-02-01', 'F', '1002010000000', '082-111-2224', '011-333-4446', 'lerato@mokoena.co.za'),

('Pieter', 'van der Merwe', 'Mr', '1990-08-05', 'M', '9008050000000', '082-111-2225', '011-333-4447', 'olivia@vdmerwe.co.za'),
('Annelize', 'van der Merwe', 'Mrs', '1980-11-22', 'F', '8011220000000', '082-111-2226', '011-333-4448', 'annelize@vdmerwe.co.za'),
('Jaco', 'van der Merwe', 'Mr', '2017-03-30', 'M', '1703300000000', '082-111-2227', '011-333-4449', 'jaco@vdmerwe.co.za'),
('Saki', 'van der Merwe', 'Mr', '2011-06-10', 'M', '1106100000000', '082-111-2227', '011-333-4449', 'saki@vdmerwe.co.za'),

('Jo-Anne', 'Smith', 'Mrs', '1972-07-20', 'F', '7207200000000', '082-222-3333', '011-444-5555', 'joanne@smith.co.za'),
('John', 'Smith', 'Mr', '1973-04-14', 'M', '7304140000000', '082-222-3334', '011-444-5556', 'john@smith.co.za'),
('Emily', 'Smith', 'Miss', '2001-06-22', 'F', '0106220000000', '082-222-3335', '011-444-5557', 'emily@smith.co.za'),

('Rajesh', 'Naidoo', 'Mr', '1982-09-17', 'M', '8209170000000', '082-222-3336', '011-444-5558', 'rajesh@naidoo.co.za'),
('Priya', 'Naidoo', 'Mrs', '1983-02-10', 'F', '8302100000000', '082-222-3337', '011-444-5559', 'priya@naidoo.co.za'),
('Kavita', 'Naidoo', 'Miss', '2000-02-10', 'F', '0002100000000', '082-222-3337', '011-444-5559', 'kavita@naidoo.co.za'),
('Sanjay', 'Naidoo', 'Mr', '1999-02-10', 'M', '9902100000000', '082-222-3337', '011-444-5559', 'sanjay@naidoo.co.za');

-- Inserting sample data for profile_person_map
INSERT INTO profile_person_map (profile_id, person_id, is_main_member, dependent_nr)
VALUES 
(1, 1, TRUE, 0), -- Thabo is the main member of profile 1
(1, 2, FALSE, 1),
(1, 3, FALSE, 2),

(5, 2, TRUE, 0),  -- Naledi is the main member of profile 5 example of a user that is involved in two profiles
(5, 3, FALSE, 1),

(2, 4, TRUE, 0), -- Pieter is the main member of profile 2
(2, 5, FALSE, 1),
(2, 6, FALSE, 2),
(2, 7, FALSE, 3),

(3, 8, TRUE, 0), -- Jo-Anne is the main member of profile 3
(3, 9, FALSE, 1),
(3, 10, FALSE, 2),

(4, 11, TRUE, 0), -- Rajesh is the main member of profile 4
(4, 12, FALSE, 1),
(4, 13, FALSE, 2), 
(4, 14, FALSE, 3); 


-- Inserting data into accounts
INSERT INTO accounts (profile_id, client_id, main_member_id, patient_id)
VALUES
-- Profile 1: Thabo (main member), Naledi, and Lerato (Total: 1200.00)
(1, 1, 1, 1), 
(1, 1, 1, 2),
(1, 1, 1, 3), 
(1, 2, 1, 3),

-- Profile 2: Pieter (main member), Annelize, Jaco, and Saki (Total: 1050.00)
(2, 2, 4, 4),
(2, 2, 4, 5),
(2, 2, 4, 6),
(2, 2, 4, 7),

-- Profile 3: Jo-Anne (main member), John, and Emily (Total: 500.00)
(3, 1, 8, 8),
(3, 1, 8, 9),
(3, 1, 8, 10),

-- Profile 4: Rajesh (main member), Priya, Kavita, and Sanjay (Total: 5050.00)
(4, 2, 11, 11),
(4, 2, 11, 12),
(4, 2, 11, 13),
(4, 2, 11, 14),

-- Profile 5: Naledi Second Profile
(5, 3, 2, 2),
(5, 3, 2, 3);

-- Inserting sample data for invoices
INSERT INTO invoices (account_id, profile_id, date_of_service, status, member_snapshot, patient_snapshot)
VALUES
-- Profile 1: Thabo, Naledi, Lerato
(1, 1, '2024-12-01', 'Processing',
 '{"member": {"first": "Thabo", "last": "Mokoena", "title": "Mr", "dob": "1990-05-15", "id_nr": "9005150093000"}}',
 '{"patient": {"first": "Thabo", "last": "Mokoena", "title": "Mr", "dob": "1990-05-15", "id_nr": "9005150094000"}}'),

(2, 1, '2024-12-02', 'Processing',
 '{"member": {"first": "Thabo", "last": "Mokoena", "title": "Mr", "dob": "1990-05-15", "id_nr": "9005150008900"}}',
 '{"patient": {"first": "Naledi", "last": "Mokoena", "title": "Mrs", "dob": "1992-04-12", "id_nr": "9204120990000"}}'),

(3, 1, '2024-12-03', 'Processing',
 '{"member": {"first": "Thabo", "last": "Mokoena", "title": "Mr", "dob": "1990-05-15", "id_nr": "9005150008800"}}',
 '{"patient": {"first": "Lerato", "last": "Mokoena", "title": "Miss", "dob": "2010-02-01", "id_nr": "1002017700000"}}'),

(4, 1, '2024-12-04', 'Processing',
 '{"member": {"first": "Thabo", "last": "Mokoena", "title": "Mr", "dob": "1990-05-15", "id_nr": "9005150006600"}}',
 '{"patient": {"first": "Lerato", "last": "Mokoena", "title": "Miss", "dob": "2010-02-01", "id_nr": "1002010000550"}}'),

-- Profile 2: Pieter, Annelize, Jaco, Saki
(5, 2, '2024-12-01', 'Processing',
 '{"member": {"first": "Pieter", "last": "van der Merwe", "title": "Mr", "dob": "1990-08-05", "id_nr": "9008050044000"}}',
 '{"patient": {"first": "Pieter", "last": "van der Merwe", "title": "Mr", "dob": "1990-08-05", "id_nr": "9008050330000"}}'),

(6, 2, '2024-12-02', 'Processing',
 '{"member": {"first": "Pieter", "last": "van der Merwe", "title": "Mr", "dob": "1990-08-05", "id_nr": "9008050022000"}}',
 '{"patient": {"first": "Annelize", "last": "van der Merwe", "title": "Mrs", "dob": "1980-11-22", "id_nr": "8011220011000"}}'),

(7, 2, '2024-12-03', 'Processing',
 '{"member": {"first": "Pieter", "last": "van der Merwe", "title": "Mr", "dob": "1990-08-05", "id_nr": "9008059000000"}}',
 '{"patient": {"first": "Jaco", "last": "van der Merwe", "title": "Mr", "dob": "2017-03-30", "id_nr": "1703380000000"}}'),

(8, 2, '2024-12-04', 'Processing',
 '{"member": {"first": "Pieter", "last": "van der Merwe", "title": "Mr", "dob": "1990-08-05", "id_nr": "9008050700000"}}',
 '{"patient": {"first": "Saki", "last": "van der Merwe", "title": "Mr", "dob": "2011-06-10", "id_nr": "1106160000000"}}'),

-- Profile 3: Jo-Anne, John, Emily
(9, 3, '2024-12-01', 'Processing',
 '{"member": {"first": "Jo-Anne", "last": "Smith", "title": "Mrs", "dob": "1972-07-20", "id_nr": "7207205000000"}}',
 '{"patient": {"first": "Jo-Anne", "last": "Smith", "title": "Mrs", "dob": "1972-07-20", "id_nr": "7207240000000"}}'),

(10, 3, '2024-12-02', 'Processing',
 '{"member": {"first": "Jo-Anne", "last": "Smith", "title": "Mrs", "dob": "1972-07-20", "id_nr": "7207203000000"}}',
 '{"patient": {"first": "John", "last": "Smith", "title": "Mr", "dob": "1973-04-14", "id_nr": "7304142000000"}}'),

(11, 3, '2024-12-03', 'Processing',
 '{"member": {"first": "Jo-Anne", "last": "Smith", "title": "Mrs", "dob": "1972-07-20", "id_nr": "720721000000"}}',
 '{"patient": {"first": "Emily", "last": "Smith", "title": "Miss", "dob": "2001-06-22", "id_nr": "0106220000900"}}'),

-- Profile 4: Rajesh, Priya, Kavita, Sanjay
(12, 4, '2024-12-01', 'Processing',
 '{"member": {"first": "Rajesh", "last": "Naidoo", "title": "Mr", "dob": "1982-09-17", "id_nr": "8209170000080"}}',
 '{"patient": {"first": "Rajesh", "last": "Naidoo", "title": "Mr", "dob": "1982-09-17", "id_nr": "8209170000700"}}'),

(13, 4, '2024-12-02', 'Processing',
 '{"member": {"first": "Rajesh", "last": "Naidoo", "title": "Mr", "dob": "1982-09-17", "id_nr": "8209170000060"}}',
 '{"patient": {"first": "Priya", "last": "Naidoo", "title": "Mrs", "dob": "1983-02-10", "id_nr": "8302100000050"}}'),

(14, 4, '2024-12-03', 'Processing',
 '{"member": {"first": "Rajesh", "last": "Naidoo", "title": "Mr", "dob": "1982-09-17", "id_nr": "8209170000400"}}',
 '{"patient": {"first": "Kavita", "last": "Naidoo", "title": "Miss", "dob": "2000-02-10", "id_nr": "0002103000000"}}'),

(15, 4, '2024-12-04', 'Processing',
 '{"member": {"first": "Rajesh", "last": "Naidoo", "title": "Mr", "dob": "1982-09-17", "id_nr": "8209170000200"}}',
 '{"patient": {"first": "Sanjay", "last": "Naidoo", "title": "Mr", "dob": "1999-02-10", "id_nr": "9902100000100"}}'),

 (16, 5, '2024-12-02', 'Processing',
 '{"member": {"first": "Naledi", "last": "Mokoena", "title": "Mrs", "dob": "1992-04-12", "id_nr": "9204120990000"}}',
 '{"patient": {"first": "Naledi", "last": "Mokoena", "title": "Mrs", "dob": "1992-04-12", "id_nr": "9204120990000"}}'),

(17, 5, '2024-12-03', 'Processing',
 '{"member": {"first": "Naledi", "last": "Mokoena", "title": "Mrs", "dob": "1990-04-12", "id_nr": "9204120990000"}}',
 '{"patient": {"first": "Lerato", "last": "Mokoena", "title": "Miss", "dob": "2010-02-01", "id_nr": "1002017700000"}}'),

(17, 5, '2024-12-04', 'Processing',
 '{"member": {"first": "Naledi", "last": "Mokoena", "title": "Mrs", "dob": "1990-04-12", "id_nr": "9204120990000"}}',
 '{"patient": {"first": "Lerato", "last": "Mokoena", "title": "Miss", "dob": "2010-02-01", "id_nr": "1002017700000"}}');


-- Inserting sample data for features
INSERT INTO features (feature_name)
VALUES 
('accounts'),
('invoices'),
('records'),
('profiles'),
('clients');

-- Inserting sample data for user features
INSERT INTO user_feature_access (user_id, feature_id, is_active, permissions)
VALUES 
(1, 1, TRUE, 'Edit'),
(1, 2, TRUE, 'Edit'),
(1, 3, TRUE, 'Edit'),
(1, 4, TRUE, 'Edit'),
(1, 5, TRUE, 'Edit'),
(2, 1, TRUE, 'Edit'),
(2, 2, TRUE, 'Edit'),
(2, 3, TRUE, 'Edit'),
(2, 4, TRUE, 'Edit'),
(2, 5, TRUE, 'Edit'),
(3, 1, TRUE, 'Edit'),
(3, 2, TRUE, 'Edit'),
(3, 3, TRUE, 'Edit'),
(3, 4, TRUE, 'Edit'),
(3, 5, TRUE, 'Edit'),
(4, 1, TRUE, 'Edit'),
(4, 2, TRUE, 'Edit'),
(4, 3, TRUE, 'Edit'),
(4, 4, TRUE, 'Edit'),
(4, 5, TRUE, 'Edit'),
(5, 1, TRUE, 'Edit'),
(5, 2, TRUE, 'Edit'),
(5, 3, TRUE, 'Edit'),
(5, 4, TRUE, 'Edit'),
(5, 5, TRUE, 'Edit'),
(6, 1, TRUE, 'Edit'),
(6, 2, TRUE, 'Edit'),
(6, 3, TRUE, 'Edit'),
(6, 4, TRUE, 'Edit'),
(6, 5, TRUE, 'Edit');

-- Inserting sample data for service centers
INSERT INTO service_centers_list (service_center_name, service_center_type)
VALUES 
('City Hospital', 'Hospital'),
('Private Rooms', 'Rooms');

-- Inserting sample data for service centers associations
INSERT INTO service_centers (service_center_list_id, client_id)
VALUES 
(1, 1),
(1, 2),
(2, 3);

-- Inserting sample data for employers
INSERT INTO employers (employer_name, employer_tel, emp_post_address, emp_str_address, emp_reg_nr)
VALUES 
('TechCorp', '555-123-4567', '123 Tech Ave', 'Building 3', 'EMP123'),
('HealthOrg', '555-987-6543', '456 Health St', 'Suite 101', 'EMP456');

-- Inserting sample data for ref_clients
INSERT INTO ref_clients_list (first, last, practice_nr)
VALUES 
('Clara', 'Green', 'PRACTICE003'),
('David', 'Blue', 'PRACTICE004');

-- Inserting sample data for client referrals
INSERT INTO ref_clients (ref_client_list_id, client_id)
VALUES 
(1, 1),
(1, 2),
(2, 3);

-- Insert data into user_client_access table
INSERT INTO user_client_access (user_id, client_id, permissions)
VALUES
(1, 1, 'Edit'),
(1, 2, 'Edit'),
(1, 3, 'Edit'),

(2, 1, 'Edit'),
(2, 2, 'Edit'),
(2, 3, 'Edit'),

(3, 1, 'Edit'),
(3, 2, 'Edit'),
(3, 3, 'Edit'),

(4, 1, 'Edit'),
(4, 2, 'Edit'),
(4, 3, 'Edit'),

(5, 1, 'Edit'),
(5, 2, 'Edit'),
(5, 3, 'Edit'),

(6, 1, 'Edit'),
(6, 2, 'Edit'),
(6, 3, 'Edit');

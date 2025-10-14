
DROP TABLE IF EXISTS person_contact_numbers,person_emails;

-- Roles (templates / grouped permissions)
CREATE TABLE roles (
  role_id INT AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(64) NOT NULL UNIQUE
);

-- Create users table
CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  role_id INT NULL,
  active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

-- Permissions (capabilities)
CREATE TABLE permissions (
  permission_id INT AUTO_INCREMENT PRIMARY KEY,
  permission_name VARCHAR(255) NOT NULL UNIQUE  -- e.g. 'admittance_accept_batches'
);

-- Default permissions per role (baseline)
CREATE TABLE role_permissions (
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(role_id),
  FOREIGN KEY (permission_id) REFERENCES permissions(permission_id)
);

-- User-specific overrides (add/remove)
CREATE TABLE user_permission_overrides (
  user_id INT NOT NULL,
  permission_id INT NOT NULL,
  effect ENUM('grant','revoke') NOT NULL,
  PRIMARY KEY (user_id, permission_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (permission_id) REFERENCES permissions(permission_id)
);

-- Create clients table
CREATE TABLE clients (
    client_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
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
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (client_id) REFERENCES clients(client_id)
);


-- client_permissions inc or client_permission_access

CREATE TABLE logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action ENUM('create', 'update', 'delete') NOT NULL,
    target_table VARCHAR(255) NOT NULL,
    target_id INT NOT NULL,
    changes JSON, 
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);


CREATE TABLE notes (
    note_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    note TEXT,
    target_table VARCHAR(255),
    target_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE clients_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT,
    action VARCHAR(255),
    old_value JSON,
    new_value JSON,
    target_table VARCHAR(255),
    target_id INT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(client_id)
);

CREATE TABLE ref_clients_list (
    ref_client_list_id INT AUTO_INCREMENT PRIMARY KEY,
    first VARCHAR(255),
    last VARCHAR(255),
    practice_nr VARCHAR(255) UNIQUE
);

CREATE TABLE ref_clients (
    ref_client_id INT AUTO_INCREMENT PRIMARY KEY,
    ref_client_list_id INT,
    client_id INT,
    FOREIGN KEY (client_id) REFERENCES clients(client_id),
    FOREIGN KEY (ref_client_list_id) REFERENCES ref_clients_list(ref_client_list_id)
);

CREATE TABLE service_centers_list (
    service_center_list_id INT AUTO_INCREMENT PRIMARY KEY,
    service_center_name VARCHAR(255),
    service_center_type ENUM('Hospital', 'Rooms') DEFAULT 'Hospital'
);

CREATE TABLE service_centers (
    service_center_id INT AUTO_INCREMENT PRIMARY KEY,
    service_center_list_id INT,
    client_id INT,
    FOREIGN KEY (client_id) REFERENCES clients(client_id),
    FOREIGN KEY (service_center_list_id) REFERENCES service_centers_list(service_center_list_id)
);

CREATE TABLE employers (
    employer_id INT AUTO_INCREMENT PRIMARY KEY,
    employer_name VARCHAR(255),
    employer_tel VARCHAR(255),
    emp_post_address VARCHAR(255),
    emp_str_address VARCHAR(255),
    emp_reg_nr VARCHAR(255) UNIQUE
);

CREATE TABLE medical_aids (
    medical_aid_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) UNIQUE
);

CREATE TABLE medical_aid_plans (
    plan_id INT AUTO_INCREMENT PRIMARY KEY,
    medical_aid_id INT,
    plan_name VARCHAR(255),
    plan_code VARCHAR(255),
    FOREIGN KEY (medical_aid_id) REFERENCES medical_aids(medical_aid_id)
);

CREATE TABLE profiles (
    profile_id INT AUTO_INCREMENT PRIMARY KEY,
    medical_aid_id INT,
    plan_id INT,
    medical_aid_nr VARCHAR(255) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (medical_aid_id) REFERENCES medical_aids(medical_aid_id),
    FOREIGN KEY (plan_id) REFERENCES medical_aid_plans(plan_id)
);

CREATE TABLE person_records (
    record_id INT AUTO_INCREMENT PRIMARY KEY,
    first VARCHAR(255),
    last VARCHAR(255),
    title ENUM('Mr', 'Mrs', 'Miss', 'Ms', 'Dr') DEFAULT NULL,
    date_of_birth DATE, 
    gender ENUM('M', 'F') DEFAULT NULL,
    id_type ENUM('Passport', 'SA ID', 'Other') DEFAULT NULL,
    id_nr VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE person_contact_numbers (
    number_id INT AUTO_INCREMENT PRIMARY KEY,
    record_id INT NOT NULL,
    num_type ENUM('Cell', 'Tell', 'Work', 'Other') DEFAULT 'Other',
    num VARCHAR(255) NOT NULL,
    FOREIGN KEY (record_id) REFERENCES person_records(record_id) 
);

CREATE TABLE person_emails (
    email_id INT AUTO_INCREMENT PRIMARY KEY,
    record_id INT NOT NULL,
    email VARCHAR(255) NOT NULL,
    FOREIGN KEY (record_id) REFERENCES person_records(record_id) 
);

CREATE TABLE person_addresses (
    address_id INT AUTO_INCREMENT PRIMARY KEY,
    record_id INT NOT NULL,
    address_type ENUM('Postal', 'Street', 'Other') DEFAULT 'Other',
    is_domicilium BOOLEAN DEFAULT FALSE,
    address VARCHAR(255) NOT NULL,
    FOREIGN KEY (record_id) REFERENCES person_records(record_id) 
);

-- Create profile_person_map table
CREATE TABLE profile_person_map (
    map_id INT AUTO_INCREMENT PRIMARY KEY,
    profile_id INT,
    record_id INT,
    is_main_member boolean,
    dependent_nr INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (profile_id) REFERENCES profiles(profile_id),
    FOREIGN KEY (record_id) REFERENCES person_records(record_id)
);

-- Create accounts table
CREATE TABLE accounts (
    account_id INT AUTO_INCREMENT PRIMARY KEY,
    profile_id INT,
    client_id INT,
    main_member_id INT NULL,
    patient_id INT NULL,
    FOREIGN KEY (client_id) REFERENCES clients(client_id),
    FOREIGN KEY (profile_id) REFERENCES profiles(profile_id),
    FOREIGN KEY (main_member_id) REFERENCES person_records(record_id),
    FOREIGN KEY (patient_id) REFERENCES person_records(record_id)
);

-- Create batches table
CREATE TABLE batches (
    batch_id INT AUTO_INCREMENT PRIMARY KEY,
    current_department ENUM('reception', 'admittance', 'billing') DEFAULT 'reception',
    current_stage ENUM('inbox','current','outbox') DEFAULT 'current',
    pending BOOLEAN DEFAULT 1,
    created_by INT,
    admitted_by INT,
    billed_by INT,
    batch_size INT,
    client_id INT,
    date_received DATE,
    method_received VARCHAR(255),
    bank_statements BOOLEAN,
    added_on_drive BOOLEAN,
    total_urgent_foreign INT,
    cc_availability VARCHAR(255),
    corrections BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(client_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    FOREIGN KEY (admitted_by) REFERENCES users(user_id),
    FOREIGN KEY (billed_by) REFERENCES users(user_id)
);

-- Create invoices table
CREATE TABLE invoices (
    invoice_id INT AUTO_INCREMENT PRIMARY KEY,
    account_id INT,
    batch_id INT,
    nr_in_batch INT,
    date_of_service DATE,
    status ENUM('Open','Archived') DEFAULT 'Open',
    ref_client_id INT NULL,
    file_nr VARCHAR(255) NULL,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    auth_nr VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (batch_id) REFERENCES batches(batch_id),
    FOREIGN KEY (account_id) REFERENCES accounts(account_id),
    FOREIGN KEY (ref_client_id) REFERENCES ref_clients(ref_client_id)
);



-- Inserting sample data for users
INSERT INTO users (email)
VALUES 
('henri@ebmaa.co.za'),
('andrea@ebmaa.co.za'),
('nicolene@ebmaa.co.za'),
('francois@ebmaa.co.za'),
('alet@ebmaa.co.za'),
('ilze@ebmaa.co.za');


-- Inserting sample data for clients
INSERT INTO clients (email, password, first, last, registration_nr, practice_nr, tell_nr, client_type)
VALUES 
('client1@email.co.za', 'test', 'Surname', 'Apple', 'REG1234', '21515151', '012-345-6789', 'Surgeon'),
('client2@email.co.za', 'test', 'Surname', 'Orange', 'REG5678', '21235151', '012-345-6789', 'Specialist'),
('client3@email.co.za', 'test', 'Surname', 'Lemon', 'REG1234', '21775151', '012-345-6789', 'Anaesthetist');

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
INSERT INTO profiles (medical_aid_id, plan_id, medical_aid_nr)
VALUES 
(1, 1, '91672345'),
(2, 2, '42125516'),
(3, 3, '74577457'),
(4, 4, 'FW515212'),
(3, 3, '74566457');

-- Inserting sample data for person_records
INSERT INTO person_records (first, last, title, date_of_birth, gender, id_nr)
VALUES 
('Thabo', 'Mokoena', 'Mr', '1990-05-15', 'M', '9005150000000'),
('Naledi', 'Mokoena', 'Mrs', '1992-04-12', 'F', '9204120000000'),
('Lerato', 'Mokoena', 'Miss', '2010-02-01', 'F', '1002010000000'),
('Pieter', 'van der Merwe', 'Mr', '1990-08-05', 'M', '9008050000000'),
('Annelize', 'van der Merwe', 'Mrs', '1980-11-22', 'F', '8011220000000'),
('Jaco', 'van der Merwe', 'Mr', '2017-03-30', 'M', '1703300000000'),
('Saki', 'van der Merwe', 'Mr', '2011-06-10', 'M', '1106100000000'),
('Jo-Anne', 'Smith', 'Mrs', '1972-07-20', 'F', '7207200000000'),
('John', 'Smith', 'Mr', '1973-04-14', 'M', '7304140000000'),
('Emily', 'Smith', 'Miss', '2001-06-22', 'F', '0106220000000'),
('Rajesh', 'Naidoo', 'Mr', '1982-09-17', 'M', '8209170000000'),
('Priya', 'Naidoo', 'Mrs', '1983-02-10', 'F', '8302100000000'),
('Kavita', 'Naidoo', 'Miss', '2000-02-10', 'F', '0002100000000'),
('Sanjay', 'Naidoo', 'Mr', '1999-02-10', 'M', '9902100000000');

-- Inserting phone numbers into person_contact_numbers
INSERT INTO person_contact_numbers (record_id, num_type, num)
VALUES 
(1, 'Cell', '082-111-2222'),
(1, 'Work', '011-333-4444'),
(2, 'Cell', '082-111-2223'),
(2, 'Work', '011-333-4445'),
(3, 'Cell', '082-111-2224'),
(3, 'Work', '011-333-4446'),
(4, 'Cell', '082-111-2225'),
(4, 'Work', '011-333-4447'),
(5, 'Cell', '082-111-2226'),
(5, 'Work', '011-333-4448'),
(6, 'Cell', '082-111-2227'),
(6, 'Work', '011-333-4449'),
(7, 'Cell', '082-111-2227'),
(7, 'Work', '011-333-4449'),
(8, 'Cell', '082-222-3333'),
(8, 'Work', '011-444-5555'),
(9, 'Cell', '082-222-3334'),
(9, 'Work', '011-444-5556'),
(10, 'Cell', '082-222-3335'),
(10, 'Work', '011-444-5557'),
(11, 'Cell', '082-222-3336'),
(11, 'Work', '011-444-5558'),
(12, 'Cell', '082-222-3337'),
(12, 'Work', '011-444-5559'),
(13, 'Cell', '082-222-3337'),
(13, 'Work', '011-444-5559'),
(14, 'Cell', '082-222-3337'),
(14, 'Work', '011-444-5559');

-- Inserting emails into person_emails
INSERT INTO person_emails (record_id, email)
VALUES 
(1, 'thabo@mokoena.co.za'),
(2, 'naledi@mokoena.co.za'),
(3, 'lerato@mokoena.co.za'),
(4, 'olivia@vdmerwe.co.za'),
(5, 'annelize@vdmerwe.co.za'),
(6, 'jaco@vdmerwe.co.za'),
(7, 'saki@vdmerwe.co.za'),
(8, 'joanne@smith.co.za'),
(9, 'john@smith.co.za'),
(10, 'emily@smith.co.za'),
(11, 'rajesh@naidoo.co.za'),
(12, 'priya@naidoo.co.za'),
(13, 'kavita@naidoo.co.za'),
(14, 'sanjay@naidoo.co.za');

-- Inserting sample data for profile_person_map
INSERT INTO profile_person_map (profile_id, record_id, is_main_member, dependent_nr)
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

(1, 1, 1, 1), 
(1, 1, 1, 2),
(1, 1, 1, 3), 
(1, 2, 1, 3),

(2, 2, 4, 4),
(2, 2, 4, 5),
(2, 2, 4, 6),
(2, 2, 4, 7),

(3, 1, 8, 8),
(3, 1, 8, 9),
(3, 1, 8, 10),

(4, 2, 11, 11),
(4, 2, 11, 12),
(4, 2, 11, 13),
(4, 2, 11, 14),

(5, 3, 2, 2),
(5, 3, 2, 3);


-- Inserting sample data for permissions
INSERT INTO permissions (permission_name)
VALUES 
('admittance-admit-batch'),
('admittance-accept-batch'),
('reception-add-batch'),
('reception-complete-batch');

-- Inserting sample data for permissions
INSERT INTO roles (role_name)
VALUES 
('admittance-manager'),
('admittance'),
('reception'),
('billing-manager'),
('billing');




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
INSERT INTO user_client_access (user_id, client_id)
VALUES
(1, 1),
(1, 2),
(1, 3),

(2, 1),
(2, 2),
(2, 3),

(3, 1),
(3, 2),
(3, 3),

(4, 1),
(4, 2),
(4, 3),

(5, 1),
(5, 2),
(5, 3),

(6, 1),
(6, 2),
(6, 3);

-- person_addresses
INSERT INTO person_addresses (record_id, address_type, is_domicilium, address)
VALUES (1, 'Postal', TRUE, 'Apple Avenue, Suite 62, Block 5, Section 4, 5000');

INSERT INTO person_addresses (record_id, address_type, is_domicilium, address)
VALUES (2, 'Postal', TRUE, 'Avocado Road, Suite 18, Block 4, Section 3, 1000');

INSERT INTO person_addresses (record_id, address_type, is_domicilium, address)
VALUES (3, 'Postal', TRUE, 'Pineapple Drive, Suite 5, Block 4, Section 4, 6000');

INSERT INTO person_addresses (record_id, address_type, is_domicilium, address)
VALUES (4, 'Postal', TRUE, 'Apple Drive, Suite 63, Block 1, Section 4, 4000');

INSERT INTO person_addresses (record_id, address_type, is_domicilium, address)
VALUES (5, 'Postal', TRUE, 'Pomegranate Avenue, Suite 47, Block 3, Section 1, 5000');

INSERT INTO person_addresses (record_id, address_type, is_domicilium, address)
VALUES (6, 'Postal', TRUE, 'Grapes Avenue, Suite 73, Block 5, Section 5, 3000');

INSERT INTO person_addresses (record_id, address_type, is_domicilium, address)
VALUES (7, 'Postal', TRUE, 'Banana Road, Suite 30, Block 1, Section 1, 6000');

INSERT INTO person_addresses (record_id, address_type, is_domicilium, address)
VALUES (8, 'Postal', TRUE, 'Plum Street, Suite 28, Block 10, Section 4, 2000');

INSERT INTO person_addresses (record_id, address_type, is_domicilium, address)
VALUES (9, 'Postal', TRUE, 'Orange Drive, Suite 90, Block 1, Section 5, 5000');

INSERT INTO person_addresses (record_id, address_type, is_domicilium, address)
VALUES (10, 'Postal', TRUE, 'Pomegranate Drive, Suite 94, Block 5, Section 4, 5000');

INSERT INTO person_addresses (record_id, address_type, is_domicilium, address)
VALUES (11, 'Postal', TRUE, 'Avocado Drive, Suite 50, Block 5, Section 2, 2000');

INSERT INTO person_addresses (record_id, address_type, is_domicilium, address)
VALUES (12, 'Postal', TRUE, 'Guava Avenue, Suite 49, Block 8, Section 2, 6000');

INSERT INTO person_addresses (record_id, address_type, is_domicilium, address)
VALUES (13, 'Postal', TRUE, 'Lychee Boulevard, Suite 65, Block 2, Section 3, 4000');

INSERT INTO person_addresses (record_id, address_type, is_domicilium, address)
VALUES (14, 'Postal', TRUE, 'Avocado Boulevard, Suite 59, Block 1, Section 1, 4000');

INSERT INTO person_addresses (record_id, address_type, is_domicilium, address)
VALUES (1, 'Street', FALSE, 'Papaya Road, Suite 100, Block 4, Section 1, 3000');

INSERT INTO person_addresses (record_id, address_type, is_domicilium, address)
VALUES (2, 'Street', FALSE, 'Pineapple Avenue, Suite 99, Block 4, Section 1, 1000');

INSERT INTO person_addresses (record_id, address_type, is_domicilium, address)
VALUES (3, 'Street', FALSE, 'Grapes Boulevard, Suite 12, Block 7, Section 2, 1000');

INSERT INTO person_addresses (record_id, address_type, is_domicilium, address)
VALUES (4, 'Street', FALSE, 'Banana Boulevard, Suite 36, Block 3, Section 5, 1000');

INSERT INTO person_addresses (record_id, address_type, is_domicilium, address)
VALUES (5, 'Street', FALSE, 'Banana Street, Suite 62, Block 4, Section 1, 5000');

INSERT INTO person_addresses (record_id, address_type, is_domicilium, address)
VALUES (6, 'Street', FALSE, 'Lychee Avenue, Suite 63, Block 8, Section 3, 6000');

INSERT INTO person_addresses (record_id, address_type, is_domicilium, address)
VALUES (7, 'Street', FALSE, 'Guava Boulevard, Suite 91, Block 3, Section 4, 3000');

INSERT INTO person_addresses (record_id, address_type, is_domicilium, address)
VALUES (8, 'Street', FALSE, 'Grapes Street, Suite 31, Block 7, Section 1, 1000');

INSERT INTO person_addresses (record_id, address_type, is_domicilium, address)
VALUES (9, 'Street', FALSE, 'Grapes Boulevard, Suite 20, Block 7, Section 5, 1000');

INSERT INTO person_addresses (record_id, address_type, is_domicilium, address)
VALUES (10, 'Street', FALSE, 'Orange Road, Suite 83, Block 7, Section 5, 3000');

INSERT INTO person_addresses (record_id, address_type, is_domicilium, address)
VALUES (11, 'Street', FALSE, 'Lychee Street, Suite 84, Block 9, Section 5, 5000');

INSERT INTO person_addresses (record_id, address_type, is_domicilium, address)
VALUES (12, 'Street', FALSE, 'Apple Avenue, Suite 2, Block 10, Section 2, 2000');

INSERT INTO person_addresses (record_id, address_type, is_domicilium, address)
VALUES (13, 'Street', FALSE, 'Plum Avenue, Suite 77, Block 3, Section 5, 4000');

INSERT INTO person_addresses (record_id, address_type, is_domicilium, address)
VALUES (14, 'Street', FALSE, 'Banana Street, Suite 78, Block 4, Section 3, 3000');

INSERT INTO person_addresses (record_id, address_type, is_domicilium, address)
VALUES (1, 'Other', FALSE, 'Orange Avenue, Suite 23, Block 7, Section 3, 4000');

INSERT INTO person_addresses (record_id, address_type, is_domicilium, address)
VALUES (2, 'Other', FALSE, 'Pineapple Drive, Suite 89, Block 5, Section 4, 5000');
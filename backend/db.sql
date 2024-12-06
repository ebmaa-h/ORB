-- Drop all tables if they exist (use this carefully in development environments)
DROP TABLE IF EXISTS profile_person_map, invoices, accounts, person_records, profiles, medical_aid_plans, medical_aids, employers, service_centers, service_centers_list, ref_doctors, ref_doctors_list, doctors_logs, logs, user_features, features, doctors, users;

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

-- Create doctors table
CREATE TABLE doctors (
    doctor_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(512) NOT NULL,
    first VARCHAR(255),
    last VARCHAR(255),
    registration_nr VARCHAR(255),
    practice_nr VARCHAR(255),
    tell_nr VARCHAR(20),
    doctor_type ENUM('Specialist', 'Anaesthetist', 'Surgeon') DEFAULT 'Anaesthetist',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create features table
CREATE TABLE features (
    feature_id INT AUTO_INCREMENT PRIMARY KEY,
    feature_name VARCHAR(255)
);

-- Create user_features table
CREATE TABLE user_features (
    user_feature_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    feature_id INT,
    is_active BOOLEAN DEFAULT FALSE,
    permissions ENUM('View', 'Edit', 'Delete') DEFAULT 'View',
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (feature_id) REFERENCES features(feature_id) ON DELETE SET NULL
);

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

-- Create doctors_logs table
CREATE TABLE doctors_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT,
    action VARCHAR(255),
    old_value JSON,
    new_value JSON,
    target_table VARCHAR(255),
    target_id INT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE SET NULL
);

-- Create ref_doctors_list table
CREATE TABLE ref_doctors_list (
    ref_doctor_list_id INT AUTO_INCREMENT PRIMARY KEY,
    first VARCHAR(255),
    last VARCHAR(255),
    practice_nr VARCHAR(255) UNIQUE
);

-- Create ref_doctors table
CREATE TABLE ref_doctors (
    ref_doctor_id INT AUTO_INCREMENT PRIMARY KEY,
    ref_doctor_list_id INT,
    doctor_id INT,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE SET NULL,
    FOREIGN KEY (ref_doctor_list_id) REFERENCES ref_doctors_list(ref_doctor_list_id) ON DELETE SET NULL
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
    doctor_id INT,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE SET NULL,
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
    post_address VARCHAR(255),
    str_address VARCHAR(255),
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
    doctor_id INT,
    main_member_id INT NULL,
    dependent_id INT NULL,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE SET NULL,
    FOREIGN KEY (profile_id) REFERENCES profiles(profile_id) ON DELETE SET NULL,
    FOREIGN KEY (main_member_id) REFERENCES person_records(person_id) ON DELETE SET NULL,
    FOREIGN KEY (dependent_id) REFERENCES person_records(person_id) ON DELETE SET NULL
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
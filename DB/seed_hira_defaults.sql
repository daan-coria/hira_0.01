/* ==========================================
   HIRA SEED SCRIPT (Hogwarts dataset)
   DEV ONLY — TRUNCATE ALL TABLES
   ========================================== */

TRUNCATE TABLE ScheduleAssignment;
TRUNCATE TABLE StaffingNeeds;
TRUNCATE TABLE Shift;
TRUNCATE TABLE ShiftTemplate;
TRUNCATE TABLE EmployeeAvailability;
TRUNCATE TABLE EmployeeLeave;
TRUNCATE TABLE Employee;
TRUNCATE TABLE Requisition;
TRUNCATE TABLE Resource_Type;
TRUNCATE TABLE JobCode;
TRUNCATE TABLE JobCategory;
TRUNCATE TABLE Department;
TRUNCATE TABLE Campus;
TRUNCATE TABLE Region;
TRUNCATE TABLE LeaveType;

/* ==========================================
   1. REGIONS  (from Campus file)
   ========================================== */

INSERT INTO Region (Region_Name)
VALUES
  ('UK'),
  ('Americas'),
  ('Europe'),
  ('Asia'),
  ('Africa');

/* IDs assumed:
   1=UK, 2=Americas, 3=Europe, 4=Asia, 5=Africa */

/* ==========================================
   2. CAMPUSES = FACILITIES (Facility ID → Campus)
   ========================================== */

INSERT INTO Campus
  (Campus_ID, Campus_Name, Campus_Short_Name,
   Weekly_Hours_Per_FTE, Region_ID, Created_By)
VALUES
  (1100, 'Hogwarts',      'HWG', 40, 1, 'seed'),
  (1000, 'Ilvermorny',    'ILV', 40, 2, 'seed'),
  (1075, 'Beauxbatons',   'BBT', 40, 3, 'seed'),
  (1175, 'Durmstrang',    'DRM', 40, 3, 'seed'),
  (1176, 'Castelobruxo',  'CBX', 40, 2, 'seed'),
  (1177, 'Koldovstoretz', 'KLD', 40, 4, 'seed'),
  (1178, 'Mahoutokoro',   'MHT', 40, 4, 'seed'),
  (1179, 'Uagadou',       'UGD', 40, 5, 'seed');

/*
   Campus_Key mapping (after insert, identity order):
   1=Hogwarts, 2=Ilvermorny, 3=Beauxbatons, 4=Durmstrang,
   5=Castelobruxo, 6=Koldovstoretz, 7=Mahoutokoro, 8=Uagadou
*/

/* ==========================================
   3. DEPARTMENTS (from Cost Center / Dept file)
   We’ll seed a few key units, including ED-Greylock.
   ========================================== */

INSERT INTO Department
  (Department_ID, Campus_Key, Department_Name,
   Functional_Area, Department_Grouping,
   Capacity, Non_Prod_Pct, Budget_wHPUoS, Created_By)
VALUES
  -- Ilvermorny: ED-Greylock (cost center 21600, unique 100021600)
  ('100021600', 2, 'ED-Greylock', 'ED', 'ED',
   30, 0.08, 2.5, 'seed'),

  -- Hogwarts examples
  ('110030271', 1, 'Ravenclaw', 'Nursing', 'Critical care',
   20, 0.10, 3.0, 'seed'),
  ('110030256', 1, 'Gryffindor', 'Nursing', 'Progressive/Step-down',
   24, 0.10, 2.7, 'seed'),
  ('110030246', 1, 'Owlery', 'Nursing', 'Med/Surg',
   28, 0.12, 2.2, 'seed');

/* Department_Key mapping (identity):
   1=ED-Greylock, 2=Ravenclaw, 3=Gryffindor, 4=Owlery
*/

/* ==========================================
   4. JOBCATEGORY  (from “Primary Job Categroy Name”)
   ========================================== */

INSERT INTO JobCategory
  (Job_Category_ID, Job_Category_Name, Created_By)
VALUES
  (20, 'Technical',             'seed'),
  (30, 'Nurse',                 'seed'),
  (70, 'Service/Support',       'seed'),
  (80, 'Administrative/Clerical','seed');

/* Job_Category_Key mapping:
   1=Technical, 2=Nurse, 3=Service/Support, 4=Administrative/Clerical
*/

/* ==========================================
   5. JOBCODE  (from staff example)
   Primary Job Code ID / Name per PDF.
   ========================================== */

INSERT INTO JobCode
  (Job_Code_ID, Job_Code_Name, Job_Category_Key, Created_By)
VALUES
  -- Technical
  (104159, 'Emergency Dept Technician', 1, 'seed'),

  -- Nurses
  (101754, 'Reg Nurse',                 2, 'seed'),
  (101694, 'Reg Nurse',                 2, 'seed'),   -- different code, same title
  (101715, 'Reg Nurse Cas',             2, 'seed'),
  (101707, 'Reg Nurse BSN',             2, 'seed'),
  (101726, 'Reg Nurse Cert',            2, 'seed'),
  (104103, 'Reg Nurse BSN Dbl Cert',    2, 'seed'),

  -- Service/Support
  (103364, 'Patient Safety Associate',  3, 'seed'),
  (101420, 'Patient Care Associate',    3, 'seed'),
  (101417, 'Patient Care Assoc Cas',    3, 'seed'),

  -- Admin / Clerical
  (100249, 'Clerk Nursing',             4, 'seed'),
  (100229, 'Clerk Nursing Cas',         4, 'seed');

/*
 JobCode_Key mapping by insert order (identity):
 1=104159 Emergency Dept Technician
 2=101754 Reg Nurse
 3=101694 Reg Nurse
 4=101715 Reg Nurse Cas
 5=101707 Reg Nurse BSN
 6=101726 Reg Nurse Cert
 7=104103 Reg Nurse BSN Dbl Cert
 8=103364 Patient Safety Associate
 9=101420 Patient Care Associate
10=101417 Patient Care Assoc Cas
11=100249 Clerk Nursing
12=100229 Clerk Nursing Cas
*/

/* ==========================================
   6. RESOURCE_TYPE
   “Best” approach: one Resource_Type per major role
   with a representative JobCode.
   ========================================== */

INSERT INTO Resource_Type
  (Campus_Key, Schedule_System_Resource_Type_ID, EHR_Resource_Type_ID,
   Resource_Type_Name, Resource_Type_Description,
   Job_Code_Key, Created_By)
VALUES
  (2, 'RN',   'RN',
   'Registered Nurse', 'All RN variants (Reg Nurse, BSN, Cert, Cas)',
   2, 'seed'),  -- representative RN code

  (2, 'TECH', 'TECH',
   'Emergency Dept Tech', 'ED Technician / Technical Staff',
   1, 'seed'),

  (2, 'SUP',  'SUP',
   'Support Staff', 'Patient Safety / Care Associates',
   8, 'seed'),

  (2, 'CLERK','CLERK',
   'Clerical Staff', 'Nursing Clerks',
   11, 'seed');

/*
 Resource_Type_ID mapping:
 1=Registered Nurse
 2=Emergency Dept Tech
 3=Support Staff
 4=Clerical Staff
*/

/* ==========================================
   7. LEAVE TYPES (generic)
   ========================================== */

INSERT INTO LeaveType
  (Leave_Type_Name, Leave_Category, Description, Is_Active)
VALUES
  ('PTO',        'Paid',   'Paid Time Off / Vacation', 'Y'),
  ('FMLA',       'Leave',  'Family and Medical Leave', 'Y'),
  ('LOA',        'Leave',  'Leave of Absence',         'Y'),
  ('Orientation','Other',  'Orientation / Training',   'Y'),
  ('Education',  'Other',  'Education / CEU',          'Y');

/*
 Leave_Type_ID mapping:
 1=PTO, 2=FMLA, 3=LOA, 4=Orientation, 5=Education
*/

/* ==========================================
   8. EMPLOYEES  (subset from Staff Data Example)
   All assigned to Department_Key = 1 (ED-Greylock).
   FTE and Expected_Hours_Per_Week kept 0 for now
   until you want real values.
   ========================================== */

INSERT INTO Employee
  (Employee_ID, Department_Key,
   HRIS_Employee_ID, Schedule_System_ID, EHR_Employee_ID,
   First_Name, Last_Name, Full_Name,
   Job_Code_Key,
   FTE, Expected_Hours_Per_Week,
   Default_Shift, Weekend_Group,
   Start_Date, Employment_Status,
   Seniority_Date, Created_By)
VALUES
  (312454, 1, '312454', '312454', '312454',
   'Leah',      'Flavin',          'Leah Flavin',
   1, 0.0, 0.0, 'Day', 'A',
   '2022-04-11', 'Active', '2022-04-11', 'seed'),

  (302038, 1, '302038', '302038', '302038',
   'Barbara',   'Jackson',        'Barbara Jackson',
   2, 0.0, 0.0, 'Day', 'A',
   '2019-08-26', 'Active', '2019-08-26', 'seed'),

  (303712, 1, '303712', '303712', '303712',
   'Abby',      'Ekutu',          'Abby Ekutu',
   2, 0.0, 0.0, 'Day', 'A',
   '2021-10-18', 'Active', '2021-10-18', 'seed'),

  (301801, 1, '301801', '301801', '301801',
   'Syed',      'Milkey',         'Syed Milkey',
   2, 0.0, 0.0, 'Day', 'B',
   '2019-08-05', 'Active', '2019-08-05', 'seed'),

  (302814, 1, '302814', '302814', '302814',
   'Jacqueline','Templeton',      'Jacqueline Templeton',
   2, 0.0, 0.0, 'Day', 'B',
   '2019-11-11', 'Active', '2019-11-11', 'seed'),

  (324156, 1, '324156', '324156', '324156',
   'Gracie',    'Meissner',       'Gracie Meissner',
   8, 0.0, 0.0, 'Day', 'C',
   '2024-12-17', 'Active', '2024-12-17', 'seed');

/*
 Employee_Key mapping (identity, order above):
 1=Leah, 2=Barbara, 3=Abby, 4=Syed, 5=Jacqueline, 6=Gracie
*/

/* ==========================================
   9. EMPLOYEE AVAILABILITY (BEST DEFAULT)
   Mon–Fri = Y, Sat/Sun = N for each employee.
   ========================================== */

INSERT INTO EmployeeAvailability
  (Employee_Key, Campus_Key, Day_Of_Week, Is_Available, Created_By)
VALUES
  -- Leah (Employee_Key = 1)
  (1, 2, 'Monday',    'Y', 'seed'),
  (1, 2, 'Tuesday',   'Y', 'seed'),
  (1, 2, 'Wednesday', 'Y', 'seed'),
  (1, 2, 'Thursday',  'Y', 'seed'),
  (1, 2, 'Friday',    'Y', 'seed'),
  (1, 2, 'Saturday',  'N', 'seed'),
  (1, 2, 'Sunday',    'N', 'seed'),

  -- Barbara (2)
  (2, 2, 'Monday',    'Y', 'seed'),
  (2, 2, 'Tuesday',   'Y', 'seed'),
  (2, 2, 'Wednesday', 'Y', 'seed'),
  (2, 2, 'Thursday',  'Y', 'seed'),
  (2, 2, 'Friday',    'Y', 'seed'),
  (2, 2, 'Saturday',  'N', 'seed'),
  (2, 2, 'Sunday',    'N', 'seed'),

  -- Abby (3)
  (3, 2, 'Monday',    'Y', 'seed'),
  (3, 2, 'Tuesday',   'Y', 'seed'),
  (3, 2, 'Wednesday', 'Y', 'seed'),
  (3, 2, 'Thursday',  'Y', 'seed'),
  (3, 2, 'Friday',    'Y', 'seed'),
  (3, 2, 'Saturday',  'N', 'seed'),
  (3, 2, 'Sunday',    'N', 'seed');

/* ==========================================
   10. EMPLOYEE LEAVE (simple examples)
   ========================================== */

INSERT INTO EmployeeLeave
  (Employee_Key, Leave_Type_ID, Start_Dt, End_Dt, Notes, Created_By)
VALUES
  (1, 1, '2024-06-03 07:00', '2024-06-05 19:00', 'PTO example', 'seed'),
  (2, 2, '2024-05-15 07:00', '2024-05-30 19:00', 'FMLA example', 'seed');

/* ==========================================
   11. SHIFT TEMPLATE (Default Shift Definitions)
   For now: basic Day / Night templates for RN & Tech.
   ========================================== */

/* RN templates at Ilvermorny (Campus_Key=2, Resource_Type_ID=1) */
INSERT INTO ShiftTemplate
  (Resource_Type_ID, Campus_Key, Day_Of_Week, Shift_Name,
   Shift_Group, Start_Time, End_Time, Break_Time, Created_By)
VALUES
  (1, 2, 'Monday',    'RN 7A-7P', 'Day',   '07:00', '19:00', '00:00', 'seed'),
  (1, 2, 'Tuesday',   'RN 7A-7P', 'Day',   '07:00', '19:00', '00:00', 'seed'),
  (1, 2, 'Wednesday', 'RN 7A-7P', 'Day',   '07:00', '19:00', '00:00', 'seed'),
  (1, 2, 'Thursday',  'RN 7A-7P', 'Day',   '07:00', '19:00', '00:00', 'seed'),
  (1, 2, 'Friday',    'RN 7A-7P', 'Day',   '07:00', '19:00', '00:00', 'seed'),

  (1, 2, 'Monday',    'RN 7P-7A', 'Night', '19:00', '07:00', '00:00', 'seed'),
  (1, 2, 'Tuesday',   'RN 7P-7A', 'Night', '19:00', '07:00', '00:00', 'seed');

/* Tech templates */
INSERT INTO ShiftTemplate
  (Resource_Type_ID, Campus_Key, Day_Of_Week, Shift_Name,
   Shift_Group, Start_Time, End_Time, Break_Time, Created_By)
VALUES
  (2, 2, 'Monday', 'Tech 11A-11P', 'Day', '11:00', '23:00', '00:00', 'seed');

/* ==========================================
   12. STAFFING NEEDS (simple defaults)
   ========================================== */

INSERT INTO StaffingNeeds
  (Resource_Type_ID, Campus_Key, Ratio_Inclusion, Direct_Pct,
   Minimum_Staffing, Minimum_Staffing_Threshold,
   Fixed, Ratio, Max_Ratio, Weekend_Rotation_Frequency, Created_By)
VALUES
  (1, 2, 'Included', 0.85, 2, 1, NULL, 5, 8, 2, 'seed'),  -- RN
  (2, 2, 'Included', 0.80, 1, 1, NULL, 8, 12, 2, 'seed'), -- Tech
  (3, 2, 'Included', 0.60, 1, 1, 1, NULL, NULL, 3, 'seed'); -- Support

/* ==========================================
   13. REQUISITION (sample open positions)
   ========================================== */

INSERT INTO Requisition
  (Requisition_ID, Requisition_Number, Department_Key, Job_Code_Key,
   Resource_Type_ID, FTE, Expected_Hours_Per_Week,
   Default_Shift, Number_Of_Openings, Posting_Date,
   Budgeted_Flag, Reason, Latest_Status, Created_By)
VALUES
  (7001, 'REQ-7001', 1, 2, 1, 0.9, 36,
   'RN 7A-7P', 2, '2024-05-10',
   1, 'Vacancy Replacement', 'Open', 'seed');

/* ==========================================
   14. SCHEDULE ASSIGNMENT (sample planned shifts)
   ========================================== */

INSERT INTO ScheduleAssignment
  (Employee_Key, Resource_Type_ID, Department_Key,
   Shift_Template_ID, Shift_Date, Start_Time, End_Time,
   Assignment_Status, Source_System,
   Created_At, Updated_At, Created_By, Updated_By)
VALUES
  (1, 1, 1, 1, '2024-06-10', '07:00', '19:00',
   'Scheduled', 'HIRA',
   GETUTCDATE(), GETUTCDATE(), 'seed', 'seed'),

  (2, 1, 1, 1, '2024-06-11', '07:00', '19:00',
   'Scheduled', 'HIRA',
   GETUTCDATE(), GETUTCDATE(), 'seed', 'seed');

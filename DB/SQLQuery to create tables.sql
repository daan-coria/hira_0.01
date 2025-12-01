/* ===========================
   REGION
   =========================== */
CREATE TABLE Region (
    Region_ID      INT IDENTITY(1,1) PRIMARY KEY,
    Region_Name    VARCHAR(50) NOT NULL
);

/* ===========================
   CAMPUS
   =========================== */
CREATE TABLE Campus (
    Campus_Key             INT IDENTITY(1,1) PRIMARY KEY,
    Campus_ID              INT        NOT NULL,
    Campus_Name            VARCHAR(255) NOT NULL,
    Campus_Short_Name      VARCHAR(50),
    Weekly_Hours_Per_FTE   DECIMAL(4,2),
    Region_ID              INT        NOT NULL,
    Created_By             VARCHAR(50),
    Created_Dt             DATETIME   DEFAULT GETUTCDATE(),
    Updated_By             VARCHAR(50),
    Updated_Dt             DATETIME,
    CONSTRAINT FK_Campus_Region
        FOREIGN KEY (Region_ID) REFERENCES Region(Region_ID)
);

/* ===========================
   JOB CATEGORY
   =========================== */
CREATE TABLE JobCategory (
    Job_Category_Key   INT IDENTITY(1,1) PRIMARY KEY,
    Job_Category_ID    INT         NOT NULL,
    Job_Category_Name  VARCHAR(100) NOT NULL,
    Created_By         VARCHAR(50),
    Created_Dt         DATETIME DEFAULT GETUTCDATE(),
    Updated_By         VARCHAR(50),
    Updated_Dt         DATETIME
);

/* ===========================
   JOB CODE
   =========================== */
CREATE TABLE JobCode (
    Job_Code_Key     INT IDENTITY(1,1) PRIMARY KEY,
    Job_Code_ID      INT          NOT NULL,
    Job_Code_Name    VARCHAR(100) NOT NULL,
    Job_Category_Key INT          NOT NULL,
    Created_By       VARCHAR(50),
    Created_Dt       DATETIME DEFAULT GETUTCDATE(),
    Updated_By       VARCHAR(50),
    Updated_Dt       DATETIME,
    CONSTRAINT FK_JobCode_JobCategory
        FOREIGN KEY (Job_Category_Key) REFERENCES JobCategory(Job_Category_Key)
);

/* ===========================
   DEPARTMENT
   =========================== */
CREATE TABLE Department (
    Department_Key       INT IDENTITY(1,1) PRIMARY KEY,
    Department_ID        VARCHAR(20)  NOT NULL,
    Campus_Key           INT          NOT NULL,
    Department_Name      VARCHAR(100) NOT NULL,
    Functional_Area      VARCHAR(100),
    Department_Grouping  VARCHAR(50),
    Capacity             INT,
    Non_Prod_Pct         DECIMAL(5,4),
    Budget_wHPUoS        DECIMAL(6,3),
    Created_By           VARCHAR(50),
    Created_Dt           DATETIME DEFAULT GETUTCDATE(),
    Updated_By           VARCHAR(50),
    Updated_Dt           DATETIME,
    CONSTRAINT FK_Department_Campus
        FOREIGN KEY (Campus_Key) REFERENCES Campus(Campus_Key)
);

/* ===========================
   RESOURCE TYPE
   =========================== */
CREATE TABLE Resource_Type (
    Resource_Type_ID                INT IDENTITY(1,1) PRIMARY KEY,
    Campus_Key                      INT          NOT NULL,
    Schedule_System_Resource_Type_ID VARCHAR(50) NOT NULL,
    EHR_Resource_Type_ID            VARCHAR(50),
    Resource_Type_Name              VARCHAR(50)  NOT NULL,
    Resource_Type_Description       VARCHAR(255),
    Job_Code_Key                    INT          NOT NULL,
    Created_By                      VARCHAR(50),
    Created_Dt                      DATETIME DEFAULT GETUTCDATE(),
    Updated_By                      VARCHAR(50),
    Updated_Dt                      DATETIME,
    CONSTRAINT FK_ResType_Campus
        FOREIGN KEY (Campus_Key) REFERENCES Campus(Campus_Key),
    CONSTRAINT FK_ResType_JobCode
        FOREIGN KEY (Job_Code_Key) REFERENCES JobCode(Job_Code_Key)
);

/* ===========================
   SHIFT TEMPLATE
   =========================== */
CREATE TABLE ShiftTemplate (
    Shift_Template_ID INT IDENTITY(1,1) PRIMARY KEY,
    Resource_Type_ID  INT          NOT NULL,
    Campus_Key        INT          NOT NULL,
    Day_Of_Week       VARCHAR(10)  NOT NULL,
    Shift_Name        VARCHAR(20)  NOT NULL,
    Shift_Group       VARCHAR(50)  NOT NULL,
    Start_Time        TIME         NOT NULL,
    End_Time          TIME         NOT NULL,
    Break_Time        TIME         NOT NULL,
    Created_By        VARCHAR(50),
    Created_Dt        DATETIME DEFAULT GETUTCDATE(),
    Updated_By        VARCHAR(50),
    Updated_Dt        DATETIME,
    CONSTRAINT FK_ShiftTemplate_ResType
        FOREIGN KEY (Resource_Type_ID) REFERENCES Resource_Type(Resource_Type_ID),
    CONSTRAINT FK_ShiftTemplate_Campus
        FOREIGN KEY (Campus_Key) REFERENCES Campus(Campus_Key)
);

/* ===========================
   SHIFT
   =========================== */
CREATE TABLE Shift (
    Shift_ID               INT IDENTITY(1,1) PRIMARY KEY,
    Schedule_System_Shift_ID VARCHAR(50) NOT NULL,
    Campus_Key             INT          NOT NULL,
    Shift_Department_ID    VARCHAR(20)  NOT NULL,
    Shift_Department_Name  VARCHAR(255),
    Shift_Start_Datetime   DATETIME     NOT NULL,
    Shift_End_Datetime     DATETIME     NOT NULL,
    Shift_Duration_Hours   DECIMAL(5,2),
    Break_Duration_Hours   DECIMAL(4,2),
    Shift_Job_Code_ID      VARCHAR(50)  NOT NULL,
    Shift_Job_Code_Description VARCHAR(100),
    Shift_Work_Rule        VARCHAR(100),
    Shift_Pay_Code         VARCHAR(50),
    Shift_Template_ID      INT,
    Created_By             VARCHAR(50),
    Created_Dt             DATETIME DEFAULT GETUTCDATE(),
    Updated_By             VARCHAR(50),
    Updated_Dt             DATETIME,
    CONSTRAINT FK_Shift_Campus
        FOREIGN KEY (Campus_Key) REFERENCES Campus(Campus_Key),
    CONSTRAINT FK_Shift_ShiftTemplate
        FOREIGN KEY (Shift_Template_ID) REFERENCES ShiftTemplate(Shift_Template_ID)
);

/* ===========================
   EMPLOYEE
   =========================== */
CREATE TABLE Employee (
    Employee_Key           INT IDENTITY(1,1) PRIMARY KEY,
    Employee_ID            INT          NOT NULL,
    Department_Key         INT          NOT NULL,
    HRIS_Employee_ID       VARCHAR(50),
    Schedule_System_ID     VARCHAR(50),
    EHR_Employee_ID        VARCHAR(50),
    First_Name             VARCHAR(100) NOT NULL,
    Last_Name              VARCHAR(100) NOT NULL,
    Full_Name              VARCHAR(100),
    Job_Code_Key           INT,
    FTE                    DECIMAL(4,2),
    Expected_Hours_Per_Week DECIMAL(5,2),
    Default_Shift          VARCHAR(50),
    Weekend_Group          VARCHAR(10),
    Start_Date             DATE         NOT NULL,
    Employment_Status      VARCHAR(20)  NOT NULL,
    Term_Date              DATE,
    Seniority_Date         DATE,
    Manager_Employee_Key   INT,
    Created_By             VARCHAR(50),
    Created_Dt             DATETIME DEFAULT GETUTCDATE(),
    Updated_By             VARCHAR(50),
    Updated_Dt             DATETIME,
    CONSTRAINT FK_Employee_Department
        FOREIGN KEY (Department_Key) REFERENCES Department(Department_Key),
    CONSTRAINT FK_Employee_JobCode
        FOREIGN KEY (Job_Code_Key) REFERENCES JobCode(Job_Code_Key),
    CONSTRAINT FK_Employee_Manager
        FOREIGN KEY (Manager_Employee_Key) REFERENCES Employee(Employee_Key)
);

/* ===========================
   LEAVE TYPE
   =========================== */
CREATE TABLE LeaveType (
    Leave_Type_ID   INT IDENTITY(1,1) PRIMARY KEY,
    Leave_Type_Name VARCHAR(100) NOT NULL,
    Leave_Category  VARCHAR(50),
    Description     VARCHAR(255),
    Is_Active       CHAR(1)      NOT NULL
);

/* ===========================
   EMPLOYEE LEAVE
   =========================== */
CREATE TABLE EmployeeLeave (
    Employee_Leave_ID INT IDENTITY(1,1) PRIMARY KEY,
    Employee_Key      INT       NOT NULL,
    Leave_Type_ID     INT       NOT NULL,
    Start_Dt          DATETIME  NOT NULL,
    End_Dt            DATETIME  NOT NULL,
    Notes             VARCHAR(MAX),
    Created_By        VARCHAR(50),
    Created_Dt        DATETIME DEFAULT GETUTCDATE(),
    Updated_By        VARCHAR(50),
    Updated_Dt        DATETIME,
    CONSTRAINT FK_EmpLeave_Employee
        FOREIGN KEY (Employee_Key) REFERENCES Employee(Employee_Key),
    CONSTRAINT FK_EmpLeave_LeaveType
        FOREIGN KEY (Leave_Type_ID) REFERENCES LeaveType(Leave_Type_ID)
);

/* ===========================
   EMPLOYEE AVAILABILITY
   =========================== */
CREATE TABLE EmployeeAvailability (
    Availability_ID INT IDENTITY(1,1) PRIMARY KEY,
    Employee_Key    INT        NOT NULL,
    Campus_Key      INT        NOT NULL,
    Day_Of_Week     VARCHAR(10) NOT NULL,
    Is_Available    CHAR(1)    NOT NULL,
    Created_By      VARCHAR(50),
    Created_Dt      DATETIME DEFAULT GETUTCDATE(),
    Updated_By      VARCHAR(50),
    Updated_Dt      DATETIME,
    CONSTRAINT FK_EmpAvail_Employee
        FOREIGN KEY (Employee_Key) REFERENCES Employee(Employee_Key),
    CONSTRAINT FK_EmpAvail_Campus
        FOREIGN KEY (Campus_Key) REFERENCES Campus(Campus_Key)
);

/* ===========================
   STAFFING NEEDS
   =========================== */
CREATE TABLE StaffingNeeds (
    Staffing_Needs_ID          INT IDENTITY(1,1) PRIMARY KEY,
    Resource_Type_ID           INT        NOT NULL,
    Campus_Key                 INT        NOT NULL,
    Ratio_Inclusion            VARCHAR(50),
    Direct_Pct                 DECIMAL(3,2),
    Minimum_Staffing           SMALLINT,
    Minimum_Staffing_Threshold SMALLINT,
    Fixed                      SMALLINT,
    Ratio                      SMALLINT,
    Max_Ratio                  SMALLINT,
    Weekend_Rotation_Frequency SMALLINT,
    Created_By                 VARCHAR(50),
    Created_Dt                 DATETIME DEFAULT GETUTCDATE(),
    Updated_By                 VARCHAR(50),
    Updated_Dt                 DATETIME,
    CONSTRAINT FK_StaffingNeeds_ResType
        FOREIGN KEY (Resource_Type_ID) REFERENCES Resource_Type(Resource_Type_ID),
    CONSTRAINT FK_StaffingNeeds_Campus
        FOREIGN KEY (Campus_Key) REFERENCES Campus(Campus_Key)
);

/* ===========================
   REQUISITION
   =========================== */
CREATE TABLE Requisition (
    Requisition_Key        INT IDENTITY(1,1) PRIMARY KEY,
    Requisition_ID         INT         NOT NULL,
    Requisition_Number     VARCHAR(50) NOT NULL,
    Department_Key         INT         NOT NULL,
    Job_Code_Key           INT,                -- FIX HERE
    Resource_Type_ID       INT         NOT NULL,
    FTE                    DECIMAL(4,2),
    Expected_Hours_Per_Week DECIMAL(5,2),
    Default_Shift          VARCHAR(50),
    Number_Of_Openings     SMALLINT,
    Report_To_ID           VARCHAR(50),
    Report_To_Name         VARCHAR(100),
    Posting_Date           DATE,
    Budgeted_Flag          TINYINT,
    Reason                 VARCHAR(255),
    Requisition_Notes      VARCHAR(MAX),
    Latest_Status          VARCHAR(50),
    Created_By             VARCHAR(50),
    Created_Dt             DATETIME DEFAULT GETUTCDATE(),
    Updated_By             VARCHAR(50),
    Updated_Dt             DATETIME,
    CONSTRAINT FK_Req_Department
        FOREIGN KEY (Department_Key)  REFERENCES Department(Department_Key),
    CONSTRAINT FK_Req_JobCode
        FOREIGN KEY (Job_Code_Key)     REFERENCES JobCode(Job_Code_Key),  -- FIX HERE
    CONSTRAINT FK_Req_ResType
        FOREIGN KEY (Resource_Type_ID) REFERENCES Resource_Type(Resource_Type_ID)
);

/* ===========================
   SCHEDULE ASSIGNMENT
   =========================== */
CREATE TABLE ScheduleAssignment (
    Schedule_Assignment_ID INT IDENTITY(1,1) PRIMARY KEY,
    Employee_Key           INT        NOT NULL,
    Resource_Type_ID       INT        NOT NULL,
    Department_Key         INT        NOT NULL,
    Shift_Template_ID      INT,
    Shift_Date             DATE       NOT NULL,
    Start_Time             TIME,
    End_Time               TIME,
    Assignment_Status      VARCHAR(20) NOT NULL,
    Source_System          VARCHAR(50),
    Created_At             DATETIME   NOT NULL,
    Updated_At             DATETIME   NOT NULL,
    Created_By             VARCHAR(50),
    Updated_By             VARCHAR(50),
    CONSTRAINT FK_SchedAssign_Employee
        FOREIGN KEY (Employee_Key)      REFERENCES Employee(Employee_Key),
    CONSTRAINT FK_SchedAssign_ResType
        FOREIGN KEY (Resource_Type_ID)  REFERENCES Resource_Type(Resource_Type_ID),
    CONSTRAINT FK_SchedAssign_Department
        FOREIGN KEY (Department_Key)    REFERENCES Department(Department_Key),
    CONSTRAINT FK_SchedAssign_ShiftTemplate
        FOREIGN KEY (Shift_Template_ID) REFERENCES ShiftTemplate(Shift_Template_ID)
);

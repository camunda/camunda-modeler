*** Settings ***
Documentation       Robot to solve the first challenge at rpachallenge.com,
...                 which consists of filling a form that randomly rearranges
...                 itself for ten times, with data taken from a provided
...                 Microsoft Excel file.

Library             RPA.Browser.Playwright
Library             RPA.Excel.Files
Library             RPA.HTTP


*** Tasks ***
Complete the challenge
    Start the challenge
    Fill the forms
    Collect the results


*** Keywords ***
Start the challenge
    New Browser
    New Page    http://rpachallenge.com/
    RPA.HTTP.Download
    ...    http://rpachallenge.com/assets/downloadFiles/challenge.xlsx
    ...    overwrite=True
    Click    button

Fill the forms
    ${people}=    Get the list of people from the Excel file
    FOR    ${person}    IN    @{people}
        Fill and submit the form    ${person}
    END

Get the list of people from the Excel file
    Open Workbook    challenge.xlsx
    ${table}=    Read Worksheet As Table    header=True
    Close Workbook
    RETURN    ${table}

Fill and submit the form
    [Arguments]    ${person}
    Fill Text    //input[@ng-reflect-name="labelFirstName"]    ${person}[First Name]
    Fill Text    //input[@ng-reflect-name="labelLastName"]    ${person}[Last Name]
    Fill Text    //input[@ng-reflect-name="labelCompanyName"]    ${person}[Company Name]
    Fill Text    //input[@ng-reflect-name="labelRole"]    ${person}[Role in Company]
    Fill Text    //input[@ng-reflect-name="labelAddress"]    ${person}[Address]
    Fill Text    //input[@ng-reflect-name="labelEmail"]    ${person}[Email]
    Fill Text    //input[@ng-reflect-name="labelPhone"]    ${person}[Phone Number]
    Click    input[type=submit]

Collect the results
    Take Screenshot  %{ROBOT_ARTIFACTS}${/}result  selector=css=div.congratulations
    Close Browser

*** Settings ***
Library         Collections
Library         RequestsLibrary
Test Template   Validate Scaffolding


*** Test Cases ***


*** Keywords ***

Validate MVT
    [Arguments]    ${url}
    ${response}=    GET  ${server}${url}     expected_status=200

*** Settings ***
Library         Collections
Library         RequestsLibrary
Test Template   Validate Testing


*** Test Cases ***

#geoid_co county_summary                     /bcat/county_summary/geojson               geoid_co=47001&state_abbr=TN    geoid_co=47001&state_abbr=TN
testing                                      /acs/testing

*** Keywords ***

Validate Testing
    [Arguments]    ${url}
        ${response}=    GET  ${server}${url}     expected_status=200

#Validate JSON
#    [Arguments]    ${url}   ${params}
#    ${response}=    GET  ${server}${url}    params=${params}                            expected_status=200

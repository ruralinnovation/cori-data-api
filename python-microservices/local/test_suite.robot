*** Settings ***
Library     Collections
Library     RequestsLibrary

*** Test Cases ***

local/test/greg
    ${response}=    GET  http://localhost:2000/local/test/greg  expected_status=200
    Dictionary Should Contain Key   ${response.json()}          hello
    Should Be Equal As Strings      ${response.json()}[hello]   hello greg

local/test
    ${response}=    GET  http://localhost:2000/local/test                               expected_status=200
    Dictionary Should Contain Key   ${response.json()}                                  type
    Dictionary Should Contain Key   ${response.json()}                                  features
    Dictionary Should Contain Key   ${response.json()}[features][0]                     geometry
    Dictionary Should Contain Key   ${response.json()}[features][0]                     properties
    Dictionary Should Contain Key   ${response.json()}[features][0][geometry]           type
    Should Be Equal As Strings      ${response.json()}[features][0][geometry][type]     MultiPolygon
    Dictionary Should Contain Key   ${response.json()}[features][0][properties]         state_abbr

test table json response with one parameter local/bcat/auction_904_subsidy_awards?geoid_co=48329
    ${response}=    GET  http://localhost:2000/local/bcat/auction_904_subsidy_awards    params=geoid_co=48329   expected_status=200
    Dictionary Should Contain Key   ${response.json()}                                  type
    Dictionary Should Contain Key   ${response.json()}                                  features
    Dictionary Should Contain Key   ${response.json()}[features][0]                     geometry
    Dictionary Should Contain Key   ${response.json()}[features][0]                     properties
    Dictionary Should Contain Key   ${response.json()}[features][0][geometry]           type
    Should Be Equal As Strings      ${response.json()}[features][0][geometry][type]     MultiPolygon
    Dictionary Should Contain Key   ${response.json()}[features][0][properties]         state_abbr

test table json response with two parameters local/bcat/auction_904_subsidy_awards?geoid_co=48329&tier=Gigabit
    ${response}=    GET  http://localhost:2000/local/bcat/auction_904_subsidy_awards    params=geoid_co=48329&tier=Gigabit      expected_status=200
    Dictionary Should Contain Key   ${response.json()}                                  type
    Dictionary Should Contain Key   ${response.json()}                                  features
    Dictionary Should Contain Key   ${response.json()}[features][0]                     geometry
    Dictionary Should Contain Key   ${response.json()}[features][0]                     properties
    Dictionary Should Contain Key   ${response.json()}[features][0][geometry]           type
    Should Be Equal As Strings      ${response.json()}[features][0][geometry][type]     MultiPolygon
    Dictionary Should Contain Key   ${response.json()}[features][0][properties]         state_abbr

test another table json response local/bcat/broadband_unserved_blocks?geoid_co=48329
    ${response}=    GET  http://localhost:2000/local/bcat/broadband_unserved_blocks     params=geoid_co=48329      expected_status=200
    Dictionary Should Contain Key   ${response.json()}                                  type
    Dictionary Should Contain Key   ${response.json()}                                  features
    Dictionary Should Contain Key   ${response.json()}[features][0]                     geometry
    Dictionary Should Contain Key   ${response.json()}[features][0]                     properties
    Dictionary Should Contain Key   ${response.json()}[features][0][geometry]           type
    Should Be Equal As Strings      ${response.json()}[features][0][geometry][type]     MultiPolygon
    Dictionary Should Contain Key   ${response.json()}[features][0][properties]         state_abbr

test an invalid but real table local/bcat/bcat_county_summary
    ${response}=    GET  http://localhost:2000/local/bcat/bcat_county_summary           expected_status=400

test an invalid parameter local/bcat/broadband_unserved_blocks?q=admin
    ${response}=    GET  http://localhost:2000/local/bcat/broadband_unserved_blocks     params=q=admin  expected_status=400

local/tiles/auction_904_subsidy_awards/10/278/408.pbf
    ${response}=    GET  http://localhost:2000/local/tiles/auction_904_subsidy_awards/10/278/408.pbf       expected_status=200


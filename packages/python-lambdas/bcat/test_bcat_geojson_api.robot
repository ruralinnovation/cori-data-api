*** Settings ***
Library         Collections
Library         RequestsLibrary
Test Template   Validate JSON


*** Test Cases ***

geoid_co auction_904_subsidy_awards                           /bcat/auction_904_subsidy_awards/geojson                          geoid_co=47001&state_abbr=TN
geoid_co broadband_unserved_blocks                            /bcat/broadband_unserved_blocks/geojson                           geoid_co=47001&state_abbr=TN
# geoid_co county_broadband_farm_bill_eligibility             /bcat/county_broadband_farm_bill_eligibility/geojson              geoid_co=47001&state_abbr=TN
# geoids county_broadband_pending_rural_dev                 /bcat/county_broadband_pending_rural_dev/geojson                  geoid_co=47001&state_abbr=TN
# geoid_co county_ilecs_geo                                   /bcat/county_ilecs_geo/geojson                                    geoid_co=47001&state_abbr=TN
# geoid_co county_rural_dev_broadband_protected_borrowers     /bcat/county_rural_dev_broadband_protected_borrowers/geojson      geoid_co=47001&state_abbr=TN
geoid_co county_summary                                       /bcat/county_summary/geojson                                      geoid_co=47001&state_abbr=TN
geoid_co fiber_cable_unserved_blocks                          /bcat/fiber_cable_unserved_blocks/geojson                         geoid_co=47001&state_abbr=TN
# geoid_co incumbent_electric_providers_geo                   /bcat/incumbent_electric_providers_geo/geojson                    geoid_co=47001&state_abbr=TN
geoid_co county_adjacency_crosswalk                           /bcat/county_adjacency_crosswalk/geojson                          geoid_co=47001&state_abbr=TN

two geoid_co auction_904_subsidy_awards                       /bcat/auction_904_subsidy_awards/geojson                          geoid_co=47001,47003
two geoid_cos broadband_unserved_blocks                        /bcat/broadband_unserved_blocks/geojson                           geoid_co=47001,47003
# two geoid_cos county_broadband_farm_bill_eligibility         /bcat/county_broadband_farm_bill_eligibility/geojson              geoid_co=47001,47003
# two geoid_cos county_broadband_pending_rural_dev             /bcat/county_broadband_pending_rural_dev/geojson                  geoid_co=47001,47003
# two geoid_cos county_ilecs_geo                               /bcat/county_ilecs_geo/geojson                                    geoid_co=47001,47003
# two geo county_rural_dev_broadband_protected_borrowers    /bcat/county_rural_dev_broadband_protected_borrowers/geojson      geoid_co=47001,47003
two geoid_cos county_summary                                   /bcat/county_summary/geojson                                      geoid_co=47001,47003
# two geoid_co incumbent_electric_providers_geo               /bcat/incumbent_electric_providers_geo/geojson                    geoid_co=47001,47003
two geoid_co county_adjacency_crosswalk                       /bcat/county_adjacency_crosswalk/geojson                          geoid_co=47001,47003


*** Keywords ***

Validate JSON
    [Arguments]    ${url}   ${params}
    ${response}=    GET  ${server}${url}    params=${params}                                     expected_status=200
    Dictionary Should Contain Key   ${response.json()}                                  type
    Dictionary Should Contain Key   ${response.json()}                                  features
    Should Be Equal As Strings      ${response.json()}[type]                            FeatureCollection
    Dictionary Should Contain Key   ${response.json()}[features][0]                     geometry
    Dictionary Should Contain Key   ${response.json()}[features][0]                     properties
    Dictionary Should Contain Key   ${response.json()}[features][0]                     type
    Should Be Equal As Strings      ${response.json()}[features][0][type]               Feature
    Dictionary Should Contain Key   ${response.json()}[features][0][geometry]           type
    Dictionary Should Contain Key   ${response.json()}[features][0][geometry]           coordinates


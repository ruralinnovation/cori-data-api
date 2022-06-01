*** Settings ***
Library         Collections
Library         RequestsLibrary
Test Template   Validate JSON


*** Test Cases ***

state_abbr auction_904_subsidy_awards                      http://localhost:2000/local/bcat/auction_904_subsidy_awards/geojson/DE                            ${None}
state_abbr broadband_unserved_blocks                       http://localhost:2000/local/bcat/broadband_unserved_blocks/geojson/DE                             ${None}
state_abbr county_broadband_farm_bill_eligibility          http://localhost:2000/local/bcat/county_broadband_farm_bill_eligibility/geojson/DE                ${None}
state_abbr county_broadband_pending_rural_dev              http://localhost:2000/local/bcat/county_broadband_pending_rural_dev/geojson/DE                    ${None}
state_abbr county_ilecs_geo                                http://localhost:2000/local/bcat/county_ilecs_geo/geojson/DE                                      ${None}
state_abbr county_rural_dev_broadband_protected_borrowers  http://localhost:2000/local/bcat/county_rural_dev_broadband_protected_borrowers/geojson/DE        ${None}
state_abbr county_summary                                  http://localhost:2000/local/bcat/county_summary/geojson/DE                                        ${None}
state_abbr fiber_cable_unserved_blocks                     http://localhost:2000/local/bcat/fiber_cable_unserved_blocks/geojson/DE                           ${None}
state_abbr incumbent_electric_providers_geo                http://localhost:2000/local/bcat/incumbent_electric_providers_geo/geojson/DE                      ${None}
state_abbr county_adjacency_crosswalk                      http://localhost:2000/local/bcat/county_adjacency_crosswalk/geojson/DE                            ${None}

geoid_co auction_904_subsidy_awards                         http://localhost:2000/local/bcat/auction_904_subsidy_awards/geojson/TX                          geoid_co=48329
geoid_co broadband_unserved_blocks                        http://localhost:2000/local/bcat/broadband_unserved_blocks/geojson/TX                             geoid_co=48329
# geoid_co county_broadband_farm_bill_eligibility           http://localhost:2000/local/bcat/county_broadband_farm_bill_eligibility/geojson/TX              geoid_co=48329
# geoid_co county_broadband_pending_rural_dev               http://localhost:2000/local/bcat/county_broadband_pending_rural_dev/geojson/TX                  geoid_co=48329
# geoid_co county_ilecs_geo                                 http://localhost:2000/local/bcat/county_ilecs_geo/geojson/TX                                    geoid_co=48329
# geoid_co county_rural_dev_broadband_protected_borrowers     http://localhost:2000/local/bcat/county_rural_dev_broadband_protected_borrowers/geojson/TX      geoid_co=48329
geoid_co county_summary                                     http://localhost:2000/local/bcat/county_summary/geojson/TX                                      geoid_co=48329
geoid_co fiber_cable_unserved_blocks                        http://localhost:2000/local/bcat/fiber_cable_unserved_blocks/geojson/TX                         geoid_co=48329
# geoid_co incumbent_electric_providers_geo                 http://localhost:2000/local/bcat/incumbent_electric_providers_geo/geojson/TX                    geoid_co=48329
geoid_co county_adjacency_crosswalk                         http://localhost:2000/local/bcat/county_adjacency_crosswalk/geojson/TX                          geoid_co=48329

two geoid_co auction_904_subsidy_awards                         http://localhost:2000/local/bcat/auction_904_subsidy_awards/geojson/TX                          geoid_co=48329,48491
two geoid_co broadband_unserved_blocks                        http://localhost:2000/local/bcat/broadband_unserved_blocks/geojson/TX                           geoid_co=48329,48491
# two geoid_co county_broadband_farm_bill_eligibility           http://localhost:2000/local/bcat/county_broadband_farm_bill_eligibility/geojson/TX              geoid_co=48329,48491
# two geoid_co county_broadband_pending_rural_dev               http://localhost:2000/local/bcat/county_broadband_pending_rural_dev/geojson/TX                  geoid_co=48329,48491
# two geoid_co county_ilecs_geo                                 http://localhost:2000/local/bcat/county_ilecs_geo/geojson/TX                                    geoid_co=48329,48491
# two geoid_co county_rural_dev_broadband_protected_borrowers     http://localhost:2000/local/bcat/county_rural_dev_broadband_protected_borrowers/geojson/TX      geoid_co=48329,48491
two geoid_co county_summary                                     http://localhost:2000/local/bcat/county_summary/geojson/TX                                      geoid_co=48329,48491
two geoid_co fiber_cable_unserved_blocks                        http://localhost:2000/local/bcat/fiber_cable_unserved_blocks/geojson/TX                         geoid_co=48329,48491
# two geoid_co incumbent_electric_providers_geo                 http://localhost:2000/local/bcat/incumbent_electric_providers_geo/geojson/TX                    geoid_co=48329,48491
two geoid_co county_adjacency_crosswalk                         http://localhost:2000/local/bcat/county_adjacency_crosswalk/geojson/TX                          geoid_co=48329,48491

*** Keywords ***

Validate JSON
    [Arguments]    ${url}   ${params}
    ${response}=    GET  ${url}    params=${params}                                     expected_status=200
    Dictionary Should Contain Key   ${response.json()}                                  type
    Dictionary Should Contain Key   ${response.json()}                                  features
    Should Be Equal As Strings      ${response.json()}[type]                            FeatureCollection

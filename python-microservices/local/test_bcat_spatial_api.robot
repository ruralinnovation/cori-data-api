*** Settings ***
Library         Collections
Library         RequestsLibrary
Test Template   Validate JSON


*** Test Cases ***

geom auction_904_subsidy_awards                             http://localhost:2000/local/bcat/auction_904_subsidy_awards/geojson                          geom=POLYGON((-82.2 34.3,-82.2 34.0,-81.9 34.0,-81.9 34.3,-82.2 34.3))
geom broadband_unserved_blocks                              http://localhost:2000/local/bcat/broadband_unserved_blocks/geojson                           geom=POLYGON((-82.2 34.3,-82.2 34.0,-81.9 34.0,-81.9 34.3,-82.2 34.3))
geom county_broadband_farm_bill_eligibility                 http://localhost:2000/local/bcat/county_broadband_farm_bill_eligibility/geojson              geom=POLYGON((-82.2 34.3,-82.2 34.0,-81.9 34.0,-81.9 34.3,-82.2 34.3))
geom county_broadband_pending_rural_dev                     http://localhost:2000/local/bcat/county_broadband_pending_rural_dev/geojson                  geom=POLYGON((-82.2 34.3,-82.2 34.0,-81.9 34.0,-81.9 34.3,-82.2 34.3))
geom county_ilecs_geo                                       http://localhost:2000/local/bcat/county_ilecs_geo/geojson                                    geom=POLYGON((-82.2 34.3,-82.2 34.0,-81.9 34.0,-81.9 34.3,-82.2 34.3))
geom county_rural_dev_broadband_protected_borrowers         http://localhost:2000/local/bcat/county_rural_dev_broadband_protected_borrowers/geojson      geom=POLYGON((-82.2 34.3,-82.2 34.0,-81.9 34.0,-81.9 34.3,-82.2 34.3))
# geom county_summary                                       http://localhost:2000/local/bcat/county_summary/geojson                                      geom=POLYGON((-82.2 34.3,-82.2 34.0,-81.9 34.0,-81.9 34.3,-82.2 34.3))
geom fiber_cable_unserved_blocks                            http://localhost:2000/local/bcat/fiber_cable_unserved_blocks/geojson                         geom=POLYGON((-82.2 34.3,-82.2 34.0,-81.9 34.0,-81.9 34.3,-82.2 34.3))
geom incumbent_electric_providers_geo                       http://localhost:2000/local/bcat/incumbent_electric_providers_geo/geojson                    geom=POLYGON((-82.2 34.3,-82.2 34.0,-81.9 34.0,-81.9 34.3,-82.2 34.3))
# geom county_adjacency_crosswalk                           http://localhost:2000/local/bcat/county_adjacency_crosswalk/geojson                          geom=POLYGON((-82.2 34.3,-82.2 34.0,-81.9 34.0,-81.9 34.3,-82.2 34.3))

*** Keywords ***

Validate JSON
    [Arguments]    ${url}   ${params}
    ${response}=    GET  ${url}    params=${params}                                     expected_status=200
    Dictionary Should Contain Key   ${response.json()}                                  type
    Dictionary Should Contain Key   ${response.json()}                                  features
    Should Be Equal As Strings      ${response.json()}[type]                            FeatureCollection

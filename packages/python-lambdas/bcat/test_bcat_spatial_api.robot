*** Settings ***
Library         Collections
Library         RequestsLibrary
Test Template   Validate JSON


*** Test Cases ***

geom auction_904_subsidy_awards                             /bcat/auction_904_subsidy_awards/geojson                          geom=POLYGON((-82.2 34.3,-82.2 34.0,-81.9 34.0,-81.9 34.3,-82.2 34.3))
geom broadband_unserved_blocks                              /bcat/broadband_unserved_blocks/geojson                           geom=POLYGON((-82.2 34.3,-82.2 34.0,-81.9 34.0,-81.9 34.3,-82.2 34.3))
geom county_broadband_farm_bill_eligibility                 /bcat/county_broadband_farm_bill_eligibility/geojson              geom=POLYGON((-82.2 34.3,-82.2 34.0,-81.9 34.0,-81.9 34.3,-82.2 34.3))
geom county_broadband_pending_rural_dev                     /bcat/county_broadband_pending_rural_dev/geojson                  geom=POLYGON((-82.2 34.3,-82.2 34.0,-81.9 34.0,-81.9 34.3,-82.2 34.3))
geom county_ilecs_geo                                       /bcat/county_ilecs_geo/geojson                                    geom=POLYGON((-82.2 34.3,-82.2 34.0,-81.9 34.0,-81.9 34.3,-82.2 34.3))
geom county_rural_dev_broadband_protected_borrowers         /bcat/county_rural_dev_broadband_protected_borrowers/geojson      geom=POLYGON((-82.2 34.3,-82.2 34.0,-81.9 34.0,-81.9 34.3,-82.2 34.3))
# geom county_summary                                       /bcat/county_summary/geojson                                      geom=POLYGON((-82.2 34.3,-82.2 34.0,-81.9 34.0,-81.9 34.3,-82.2 34.3))
geom incumbent_electric_providers_geo                       /bcat/incumbent_electric_providers_geo/geojson                    geom=POLYGON((-82.2 34.3,-82.2 34.0,-81.9 34.0,-81.9 34.3,-82.2 34.3))
# geom county_adjacency_crosswalk                           /bcat/county_adjacency_crosswalk/geojson                          geom=POLYGON((-82.2 34.3,-82.2 34.0,-81.9 34.0,-81.9 34.3,-82.2 34.3))

*** Keywords ***

Validate JSON
    [Arguments]    ${url}   ${params}
    ${response}=    GET  ${server}${url}    params=${params}                                     expected_status=200
    Dictionary Should Contain Key   ${response.json()}                                  type
    Dictionary Should Contain Key   ${response.json()}                                  features
    Should Be Equal As Strings      ${response.json()}[type]                            FeatureCollection

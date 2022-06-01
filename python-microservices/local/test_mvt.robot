*** Settings ***
Library         Collections
Library         RequestsLibrary
Test Template   Validate MVT


*** Test Cases ***

mvt tiles auction_904_subsidy_awards                             http://localhost:2000/local/bcat/tiles/auction_904_subsidy_awards/10/278/408.pbf
mvt tiles broadband_unserved_blocks                              http://localhost:2000/local/bcat/tiles/broadband_unserved_blocks/10/278/408.pbf
mvt tiles county_broadband_farm_bill_eligibility                 http://localhost:2000/local/bcat/tiles/county_broadband_farm_bill_eligibility/10/278/408.pbf
mvt tiles county_broadband_pending_rural_dev                     http://localhost:2000/local/bcat/tiles/county_broadband_pending_rural_dev/10/278/408.pbf
mvt tiles county_ilecs_geo                                       http://localhost:2000/local/bcat/tiles/county_ilecs_geo/10/278/408.pbf
mvt tiles county_rural_dev_broadband_protected_borrowers         http://localhost:2000/local/bcat/tiles/county_rural_dev_broadband_protected_borrowers/10/278/408.pbf
# mvt tiles county_summary                                       http://localhost:2000/local/bcat/tiles/county_summary/10/278/408.pbf
mvt tiles fiber_cable_unserved_blocks                            http://localhost:2000/local/bcat/tiles/fiber_cable_unserved_blocks/10/278/408.pbf
mvt tiles incumbent_electric_providers_geo                       http://localhost:2000/local/bcat/tiles/incumbent_electric_providers_geo/10/278/408.pbf
# mvt tiles county_adjacency_crosswalk                           http://localhost:2000/local/bcat/tiles/county_adjacency_crosswalk/10/278/408.pbf


*** Keywords ***

Validate MVT
    [Arguments]    ${url}
    ${response}=    GET  ${url}     expected_status=200

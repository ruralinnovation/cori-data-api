*** Settings ***
Library         Collections
Library         RequestsLibrary
Test Template   Validate MVT


*** Test Cases ***

mvt tiles auction_904_subsidy_awards                             /bcat/tiles/auction_904_subsidy_awards/10/278/408.pbf
mvt tiles broadband_unserved_blocks                              /bcat/tiles/broadband_unserved_blocks/10/278/408.pbf
mvt tiles county_broadband_farm_bill_eligibility                 /bcat/tiles/county_broadband_farm_bill_eligibility/10/278/408.pbf
mvt tiles county_broadband_pending_rural_dev                     /bcat/tiles/county_broadband_pending_rural_dev/10/278/408.pbf
mvt tiles county_ilecs_geo                                       /bcat/tiles/county_ilecs_geo/10/278/408.pbf
mvt tiles county_rural_dev_broadband_protected_borrowers         /bcat/tiles/county_rural_dev_broadband_protected_borrowers/10/278/408.pbf
# mvt tiles county_summary                                       /bcat/tiles/county_summary/10/278/408.pbf
mvt tiles fiber_cable_unserved_blocks                            /bcat/tiles/fiber_cable_unserved_blocks/10/278/408.pbf
mvt tiles incumbent_electric_providers_geo                       /bcat/tiles/incumbent_electric_providers_geo/10/278/408.pbf
# mvt tiles county_adjacency_crosswalk                           /bcat/tiles/county_adjacency_crosswalk/10/278/408.pbf


*** Keywords ***

Validate MVT
    [Arguments]    ${url}
    ${response}=    GET  ${server}${url}     expected_status=200

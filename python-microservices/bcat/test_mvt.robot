*** Settings ***
Library         Collections
Library         RequestsLibrary
Test Template   Validate MVT


*** Test Cases ***

mvt tiles auction_904_subsidy_awards                             /bcat/auction_904_subsidy_awards/tiles/10/278/408.pbf
mvt tiles broadband_unserved_blocks                              /bcat/broadband_unserved_blocks/tiles/10/278/408.pbf
mvt tiles county_broadband_farm_bill_eligibility                 /bcat/county_broadband_farm_bill_eligibility/tiles/10/278/408.pbf
mvt tiles county_broadband_pending_rural_dev                     /bcat/county_broadband_pending_rural_dev/tiles/10/278/408.pbf
mvt tiles county_ilecs_geo                                       /bcat/county_ilecs_geo/tiles/10/278/408.pbf
mvt tiles county_rural_dev_broadband_protected_borrowers         /bcat/county_rural_dev_broadband_protected_borrowers/tiles/10/278/408.pbf
# mvt tiles county_summary                                       /bcat/county_summary/tiles/10/278/408.pbf
mvt tiles incumbent_electric_providers_geo                       /bcat/incumbent_electric_providers_geo/tiles/10/278/408.pbf
# mvt tiles county_adjacency_crosswalk                           /bcat/county_adjacency_crosswalk/tiles/10/278/408.pbf


*** Keywords ***

Validate MVT
    [Arguments]    ${url}
    ${response}=    GET  ${server}${url}     expected_status=200

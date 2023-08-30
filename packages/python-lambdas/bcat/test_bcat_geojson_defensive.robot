*** Settings ***
Library         Collections
Library         RequestsLibrary


*** Test Cases ***

test invalid table rejected         ${response}=    GET  ${server}/bcat/not_a_table/geojson          expected_status=400
test mvt invalid table rejected     ${response}=    GET  ${server}/bcat/not_a_table/tiles/10/278/408.pbf      expected_status=400
test invalid parameter rejected     ${response}=    GET  ${server}/bcat/auction_904_subsidy_awards/geojson    params=id=48491     expected_status=400
test sql injection rejected         ${response}=    GET  ${server}/bcat/auction_904_subsidy_awards/geojson    params=id=48491;drop table something_important     expected_status=400

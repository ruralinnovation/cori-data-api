CREATE ROLE read_only_access;
GRANT CONNECT ON DATABASE data to read_only_access;
GRANT USAGE ON SCHEMA
	acs,
    bcat,
	location_analysis,
    public,
	sch_broadband,
	sch_census_tiger
	to read_only_access;
GRANT SELECT ON ALL TABLES IN SCHEMA
    acs,
    bcat,
    location_analysis,
    public,
    sch_broadband,
    sch_census_tiger
    to read_only_access;

CREATE USER read_only_user WITH PASSWORD '';
GRANT read_only_access TO read_only_user;

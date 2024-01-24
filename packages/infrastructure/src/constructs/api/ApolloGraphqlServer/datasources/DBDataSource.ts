import * as pg from 'pg';
import { DataSource } from 'apollo-datasource';
import { EnvConfig } from "../EnvConfig";

export default class DBDataSource<TContext = any> extends DataSource {
    context!: TContext;

    constructor() {
        super();
    }

    public getDBConfig (schema) {

        const host = 'cori-risi-ad-postgresql.c6zaibvi9wyg.us-east-1.rds.amazonaws.com';
        const port = '5432';
        const dbname = 'data';
        const username = 'read_only_user';
        const password = EnvConfig.DB_SECRET;;

        console.log("PostgreSQL connection tokens gathered from aws:", {
            host,
            port,
            dbname,
            username,
            password: (<String>password).replace(/[A-Za-z0-9]/g, "*"),
            "schema": schema
        });

        return {
            "development": {
                "database": dbname,
                "host": host,
                "port": port,
                "dialect": "postgres",
                "dialectModule": pg,
                "pool": {
                    "max": 10,
                    "min": 0,
                    "acquire": 3000,
                    "idle": 1000,
                },
                "username": username,
                "password": password,
                "schema": schema
            }
        };
    }
}
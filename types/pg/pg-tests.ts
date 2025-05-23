import { connect } from "net";
import * as pg from "pg";
import {
    Client,
    Connection,
    CustomTypesConfig,
    DatabaseError,
    defaults,
    Pool,
    QueryArrayConfig,
    TypeOverrides as TypeOverridesNamed,
    types,
} from "pg";
import TypeOverrides = require("pg/lib/type-overrides");
import { NoticeMessage } from "pg-protocol/dist/messages.js";

// https://github.com/brianc/node-pg-types
// tslint:disable-next-line no-unnecessary-callback-wrapper
types.setTypeParser(20, val => Number(val));

const poolSize: number | undefined = defaults.poolSize;
const poolIdleTimeout: number | undefined = defaults.poolIdleTimeout;
const reapIntervalMillis: number | undefined = defaults.reapIntervalMillis;
const binary: boolean | undefined = defaults.binary;
const parseInt8: boolean | undefined = defaults.parseInt8;
const parseInputDatesAsUTC: boolean | undefined = defaults.parseInputDatesAsUTC;

const client = new Client({
    host: "my.database-server.com",
    port: 5334,
    user: "database-user",
    password: "secretpassword!!",
    application_name: "DefinitelyTyped",
    keepAlive: true,
});
client.setTypeParser(20, val => Number(val));
client.getTypeParser(20);

const user: string | undefined = client.user;
const database: string | undefined = client.database;
const port: number = client.port;
const host: string = client.host;
const password: string | undefined = client.password;
const ssl: boolean = client.ssl;

const escapeIdentifier: (str: string) => string = pg.escapeIdentifier;
const escapeLiteral: (str: string) => string = pg.escapeLiteral;

client.on("notice", (notice: NoticeMessage) => console.warn(`${notice.severity}: ${notice.message}`));
client.connect(err => {
    if (err) {
        console.error("Could not connect to postgres", err);
        return;
    }
    client.query("SELECT NOW() AS 'theTime'", (err, result) => {
        if (err) {
            console.error("Error running query", err);
            return;
        }
        console.log(result.rowCount);
        console.log(result.rows[0]["theTime"]);
        client.end();
        return null;
    });
    return null;
});
client.on("end", () => console.log("Client was disconnected."));

client
    .connect()
    .then(() => console.log("connected"))
    .catch(e => console.error("connection error", e.stack));

client.query("SELECT NOW()", (err, res) => {
    if (err) throw err;
    console.log(res);
    client.end();
});

client.query("SELECT $1::text as name, $2::float as age", ["brianc", 99], (err, res) => {
    if (err) throw err;
    console.log(res);
    client.end();
});

interface Person {
    name: string;
    age: number;
}

client.query<Person, [string, number]>("SELECT $1::text as name, $2::float as age", ["brianc", 99], (err, res) => {
    if (err) throw err;
    console.log(res.rows[0].name, res.rows[0].age);
    client.end();
});

const query = {
    name: "get-name",
    text: "SELECT $1::text, $2::float",
    values: ["brianc", 99],
    rowMode: ["array"],
};
client.query(query, (err, res) => {
    if (err) {
        console.error(err.stack);
    } else {
        console.log(res.rows);
        console.log(res.fields.map(f => f.name));
    }
});
client
    .query(query)
    .then(res => {
        console.log(res.rows);
        console.log(res.fields.map(f => f.name));
    })
    .catch(e => {
        console.error(e.stack);
    });
client
    .query(query, ["brianc", 99])
    .then(res => {
        console.log(res.rows);
        console.log(res.fields.map(f => f.name));
    })
    .catch(e => {
        console.error(e.stack);
    });

const queryArrMode: QueryArrayConfig<[string, number]> = {
    name: "get-name-array",
    text: "SELECT $1::text, $2::float",
    values: ["brianc", 99],
    rowMode: "array",
};
client.query(queryArrMode, (err, res) => {
    if (err) {
        console.error(err.stack);
    } else {
        console.log(res.rows);
        console.log(res.fields.map(f => f.name));
    }
});
client
    .query(queryArrMode)
    .then(res => {
        console.log(res.rows);
        console.log(res.fields.map(f => f.name));
    })
    .catch(e => {
        console.error(e.stack);
    });
client
    .query({
        text: "select 1",
        rowMode: "array",
    })
    .then(res => console.log(res.fields[0]));

const customTypes: CustomTypesConfig = {
    getTypeParser: () => () => "aCustomTypeParser!",
};

const queryCustomTypes: pg.QueryConfig<[string, number]> = {
    name: "get-name",
    text: "SELECT $1::text, $2::float",
    values: ["brianc", 99],
    types: customTypes,
};
client.query(queryCustomTypes, (err, res) => {
    if (err) {
        console.error(err.stack);
    } else {
        console.log(res.rows);
        console.log(res.fields.map(f => f.name));
    }
});

client.end(err => {
    console.log("client has disconnected");
    if (err) {
        console.log("error during disconnection", err.stack);
    }
});

client
    .end()
    .then(() => console.log("client has disconnected"))
    .catch(err => console.error("error during disconnection", err.stack));

const clientCustomQueryTypes = new Client({
    host: "my.database-server.com",
    port: 5334,
    user: "database-user",
    password: "secretpassword!!",
    application_name: "DefinitelyTyped",
    keepAlive: true,
    types: customTypes,
});

clientCustomQueryTypes.query(query, (err, res) => {
    if (err) {
        console.error(err.stack);
    } else {
        console.log(res.rows);
        console.log(res.fields.map(f => f.name));
    }
});

clientCustomQueryTypes
    .end()
    .then(() => console.log("client has disconnected"))
    .catch(err => console.error("error during disconnection", err.stack));

const customTypeOverrides = new TypeOverrides();
customTypeOverrides.setTypeParser(types.builtins.INT8, BigInt);

const customCustomTypeOverrides = new TypeOverrides(customTypes);
customTypeOverrides.setTypeParser(types.builtins.INT8, BigInt);

const customTypeOverridesFromNamed = new TypeOverridesNamed();
customTypeOverrides.setTypeParser(types.builtins.INT8, BigInt);

client.connection.once("rowDescription", () => {
    console.log("client connection rowDescription event");
});
// @ts-expect-error – connection is readonly
client.connection = new Connection();

// pg.Pool
// https://node-postgres.com/apis/pool

// no params ctor
const poolParameterlessCtor = new Pool();

const poolOne = new Pool({
    connectionString: "postgresql://dbuser:secretpassword@database.server.com:3211/mydb",
});

class MyClient extends Client {
    constructor() {
        super();
    }
}

const pool = new Pool({
    host: "localhost",
    port: 5432,
    user: "database-user",
    database: "my_db",
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    keepAlive: false,
    lock_timeout: 5000,
    log: (...args) => {
        console.log.apply(console, args);
    },
    "Client": MyClient,
});
console.log(pool.totalCount);
console.log(pool.idleCount);
console.log(pool.waitingCount);
console.log(pool.expiredCount);
console.log(pool.options.lock_timeout);
pool.connect((err, client, done) => {
    if (err) {
        console.error("error fetching client from pool", err);
        return;
    }

    // $ExpectType PoolOptions
    pool.options;

    // $ExpectType boolean
    pool.ending;

    // $ExpectType boolean
    pool.ended;

    // @ts-expect-error
    client.query("SELECT");
    client?.query("SELECT $1::int AS number", ["1"], (err, result) => {
        done();

        if (err) {
            console.error("error running query", err);
            return;
        }
        console.log(result.rows[0].number);
    });
});

pool.connect().then(client => {
    client
        .query({ text: "SELECT $1::int AS number", values: ["1"], rowMode: "array" })
        .then(result => {
            console.log(result.rowCount, result.rows[0][0], result.fields[0].name);
        })
        .then(
            () => client.release(),
            e => client.release(e),
        );
});

pool.on("error", (err, client) => {
    // $ExpectType PoolClient
    client;
    console.error("idle client error", err.message, err.stack);
});
pool.on("connect", (client) => {
    // $ExpectType PoolClient
    client;
});
pool.on("acquire", (client) => {
    // $ExpectType PoolClient
    client;
});
pool.on("release", (err, client) => {
    // $ExpectType PoolClient
    client;
    if (err) {
        console.error("connection released to pool: ", err.message);
    }
});
pool.on("remove", (client) => {
    // $ExpectType PoolClient
    client;
});

(async () => {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release(true);
})();

pool.query("SELECT $1::text as name, $2::float as age", ["brianc", 99], (err, result) => {
    if (err) {
        console.error("Error executing query", err.stack);
        return;
    }
    console.log(result.rows[0].name);
});

pool.query("SELECT $1::text as name, $2::float as age", ["brianc", 99])
    .then(res => console.log(res.rows[0].name))
    .catch(err => console.error("Error executing query", err.stack));
pool.query({ text: "SELECT $1::text as name, $2::float as age" }, ["brianc", 99])
    .then(res => console.log(res.rows[0].name))
    .catch(err => console.error("Error executing query", err.stack));

pool.end(() => {
    console.log("pool has ended");
});

pool.end().then(() => console.log("pool has ended"));

(async () => {
    const client = await pool.connect();
    try {
        await client.query("SELECT NOW()");
    } catch (err) {
        if (err instanceof DatabaseError) {
            if (err.position !== undefined) {
                const position: string = err.position;
                console.log(position);
            }
        }
    }
    client.release();
})();

// Set allowExitOnIdle on pool constructor
const poolExitOnIdle = new Pool({ allowExitOnIdle: true });

// Set maxUses on pool constructor
const poolMaxUses = new Pool({ maxUses: 100 });

// client constructor tests
// client config object tested above
let c = new Client(); // empty constructor allowed
c = new Client("connectionString"); // connection string allowed
c = new Client({
    connectionString: "connectionString",
    connectionTimeoutMillis: 1000, // connection timeout optionally specified
});

// using custom socket factory method
c = new Client({
    stream: () =>
        connect({
            host: "my.database-server.com",
            port: 5334,
        }),
});

const dynamicPasswordSync = new Client({
    password: () => "sync-secret",
});
dynamicPasswordSync.connect();

const dynamicPasswordAsync = new Client({
    password: async () => "sync-secret",
});
dynamicPasswordAsync.connect();

const bindConfig = {
    statement: "Select 1 from foo where bar = $1",
    binary: "false",
    values: ["xyz"],
    valueMapper: (param: any, index: number) => [param, index],
};

const con = new Connection();
con.bind(bindConfig, true);

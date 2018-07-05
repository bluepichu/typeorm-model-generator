"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Engine_1 = require("./Engine");
const Yargs = require("yargs");
const TomgUtils = require("./Utils");
const path = require("path");
const NamingStrategy_1 = require("./NamingStrategy");
var argv = Yargs.usage("Usage: typeorm-model-generator -h <host> -d <database> -p [port] -u <user> -x [password] -e [engine]")
    .option("h", {
    alias: "host",
    describe: "IP adress/Hostname for database server",
    default: "127.0.0.1"
})
    .option("d", {
    alias: "database",
    describe: "Database name(or path for sqlite)",
    demand: true
})
    .option("u", {
    alias: "user",
    describe: "Username for database server"
})
    .option("x", {
    alias: "pass",
    describe: "Password for database server",
    default: ""
})
    .option("p", {
    alias: "port",
    describe: "Port number for database server"
})
    .option("e", {
    alias: "engine",
    describe: "Database engine",
    choices: ["mssql", "postgres", "mysql", "mariadb", "oracle", "sqlite"],
    default: "mssql"
})
    .option("o", {
    alias: "output",
    describe: "Where to place generated models",
    default: path.resolve(process.cwd(), "output")
})
    .option("s", {
    alias: "schema",
    describe: "Schema name to create model from. Only for mssql and postgres"
})
    .option("ssl", {
    boolean: true,
    default: false
})
    .option("noConfig", {
    boolean: true,
    describe: `Doesn't create tsconfig.json and ormconfig.json`,
    default: false
})
    .option("cf", {
    alias: "case-file",
    describe: "Convert file names to specified case",
    choices: ["pascal", "param", "camel", "none"],
    default: "none"
})
    .option("ce", {
    alias: "case-entity",
    describe: "Convert class names to specified case",
    choices: ["pascal", "camel", "none"],
    default: "none"
})
    .option("cp", {
    alias: "case-property",
    describe: "Convert property names to specified case",
    choices: ["pascal", "camel", "none"],
    default: "none"
})
    .option("ri", {
    alias: "remove-id",
    describe: "Remove _id suffix from fields",
    default: false
})
    .option("lazy", {
    describe: "Generate lazy relations",
    boolean: true,
    default: false
})
    .option("namingStrategy", {
    describe: "Use custom naming strategy"
})
    .option("relationIds", {
    describe: "Generate RelationId fields",
    boolean: true,
    default: false
})
    .option("generateConstructor", {
    describe: "Generate constructor allowing partial initialization",
    default: false
}).argv;
let driver;
let standardPort;
let standardSchema = "";
let standardUser = "";
switch (argv.e) {
    case "mssql":
        driver = new (require("./drivers/MssqlDriver").MssqlDriver)();
        standardPort = 1433;
        standardSchema = "dbo";
        standardUser = "sa";
        break;
    case "postgres":
        driver = new (require("./drivers/PostgresDriver").PostgresDriver)();
        standardPort = 5432;
        standardSchema = "public";
        standardUser = "postgres";
        break;
    case "mysql":
        driver = new (require("./drivers/MysqlDriver").MysqlDriver)();
        standardPort = 3306;
        standardUser = "root";
        break;
    case "mariadb":
        driver = new (require("./drivers/MariaDbDriver").MariaDbDriver)();
        standardPort = 3306;
        standardUser = "root";
        break;
    case "oracle":
        driver = new (require("./drivers/OracleDriver").OracleDriver)();
        standardPort = 1521;
        standardUser = "SYS";
        break;
    case "sqlite":
        driver = new (require("./drivers/SqliteDriver").SqliteDriver)();
        standardPort = 0;
        break;
    default:
        TomgUtils.LogError("Database engine not recognized.", false);
        throw new Error("Database engine not recognized.");
}
let namingStrategy;
if (argv.namingStrategy && argv.namingStrategy != "") {
    let req = require(argv.namingStrategy);
    namingStrategy = new req.NamingStrategy();
}
else {
    namingStrategy = new NamingStrategy_1.NamingStrategy();
}
let engine = new Engine_1.Engine(driver, {
    host: argv.h,
    port: parseInt(argv.p) || standardPort,
    databaseName: argv.d ? argv.d.toString() : null,
    user: argv.u ? argv.u.toString() : standardUser,
    password: argv.x ? argv.x.toString() : null,
    databaseType: argv.e,
    resultsPath: argv.o ? argv.o.toString() : null,
    schemaName: argv.s ? argv.s.toString() : standardSchema,
    ssl: argv.ssl,
    noConfigs: argv.noConfig,
    convertCaseFile: argv.cf,
    convertCaseEntity: argv.ce,
    convertCaseProperty: argv.cp,
    removeIdSuffix: argv.ri,
    lazy: argv.lazy,
    constructor: argv.generateConstructor,
    relationIds: argv.relationIds,
    namingStrategy: namingStrategy
});
console.log(TomgUtils.packageVersion());
console.log(`[${new Date().toLocaleTimeString()}] Starting creation of model classes.`);
engine.createModelFromDatabase().then(() => {
    console.info(`[${new Date().toLocaleTimeString()}] Typeorm model classes created.`);
});
//# sourceMappingURL=index.js.map
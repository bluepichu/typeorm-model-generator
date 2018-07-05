import { AbstractDriver } from "./drivers/AbstractDriver";
import { DatabaseModel } from "./models/DatabaseModel";
import * as Handlebars from "handlebars";
import fs = require("fs");
import path = require("path");
import * as TomgUtils from "./Utils";
import changeCase = require("change-case");
import { AbstractNamingStrategy } from "./AbstractNamingStrategy";

export class Engine {
    constructor(
        private driver: AbstractDriver,
        public Options: EngineOptions
    ) {}

    public async createModelFromDatabase(): Promise<boolean> {
        let dbModel = await this.getEntitiesInfo(
            this.Options.databaseName,
            this.Options.host,
            this.Options.port,
            this.Options.user,
            this.Options.password,
            this.Options.schemaName,
            this.Options.ssl,
            this.Options.namingStrategy,
            this.Options.relationIds
        );
        if (dbModel.entities.length > 0) {
            this.createModelFromMetadata(dbModel);
        } else {
            TomgUtils.LogError(
                "Tables not found in selected database. Skipping creation of typeorm model.",
                false
            );
        }
        return true;
    }
    private async getEntitiesInfo(
        database: string,
        server: string,
        port: number,
        user: string,
        password: string,
        schemaName: string,
        ssl: boolean,
        namingStrategy: AbstractNamingStrategy,
        relationIds: boolean
    ): Promise<DatabaseModel> {
        return await this.driver.GetDataFromServer(
            database,
            server,
            port,
            user,
            password,
            schemaName,
            ssl,
            namingStrategy,
            relationIds
        );
    }
    private createModelFromMetadata(databaseModel: DatabaseModel) {
        this.createHandlebarsHelpers();
        let templatePath = path.resolve(__dirname, "../../src/entity.mst");
        let template = fs.readFileSync(templatePath, "UTF-8");
        let resultPath = this.Options.resultsPath;
        if (!fs.existsSync(resultPath)) fs.mkdirSync(resultPath);
        let entitesPath = resultPath;
        if (!this.Options.noConfigs) {
            this.createTsConfigFile(resultPath);
            this.createTypeOrmConfig(resultPath);
            entitesPath = path.resolve(resultPath, "./entities");
            if (!fs.existsSync(entitesPath)) fs.mkdirSync(entitesPath);
        }
        let compliedTemplate = Handlebars.compile(template, { noEscape: true });
        databaseModel.entities.forEach(element => {
            let casedFileName = "";
            switch (this.Options.convertCaseFile) {
                case "camel":
                    casedFileName = changeCase.camelCase(element.EntityName);
                    break;
                case "param":
                    casedFileName = changeCase.paramCase(element.EntityName);
                    break;
                case "pascal":
                    casedFileName = changeCase.pascalCase(element.EntityName);
                    break;
                case "none":
                    casedFileName = element.EntityName;
                    break;
            }
            let resultFilePath = path.resolve(
                entitesPath,
                casedFileName + ".ts"
            );
            let rendered = compliedTemplate(element);
            fs.writeFileSync(resultFilePath, rendered, {
                encoding: "UTF-8",
                flag: "w"
            });
        });

        let enumTemplatePath = path.resolve(__dirname, "../../src/enum.mst");
        let enumTemplate = fs.readFileSync(enumTemplatePath, "UTF-8");
        let compiledEnumTemplate = Handlebars.compile(enumTemplate, { noEscape: true });
        databaseModel.enums.forEach((en) => {
            let rendered = compiledEnumTemplate(en);
            let casedFileName = "";
            switch (this.Options.convertCaseFile) {
                case "camel":
                    casedFileName = changeCase.camelCase(en.name);
                    break;
                case "param":
                    casedFileName = changeCase.paramCase(en.name);
                    break;
                case "pascal":
                    casedFileName = changeCase.pascalCase(en.name);
                    break;
                case "none":
                    casedFileName = en.name;
                    break;
            }
            let resultFilePath = path.resolve(
                entitesPath,
                casedFileName + ".ts"
            );
            fs.writeFileSync(resultFilePath, rendered, {
                encoding: "UTF-8",
                flag: "w"
            });
        });
    }
    private createHandlebarsHelpers() {
        let toEntityName = (str) => {
            let retStr = "";
            switch (this.Options.convertCaseEntity) {
                case "camel":
                    retStr = changeCase.camelCase(str);
                    break;
                case "pascal":
                    retStr = changeCase.pascalCase(str);
                    break;
                case "none":
                    retStr = str;
                    break;
            }
            return retStr;
        };

        Handlebars.registerHelper("curly", open => {
            return open ? "{" : "}";
        });
        Handlebars.registerHelper("toEntityName", str => {
            let retStr = "";
            switch (this.Options.convertCaseEntity) {
                case "camel":
                    retStr = changeCase.camelCase(str);
                    break;
                case "pascal":
                    retStr = changeCase.pascalCase(str);
                    break;
                case "none":
                    retStr = str;
                    break;
            }
            return retStr;
        });
        Handlebars.registerHelper("concat", (stra, strb) => {
            return stra + strb;
        });
        Handlebars.registerHelper("toFileName", str => {
            let retStr = "";
            switch (this.Options.convertCaseFile) {
                case "camel":
                    retStr = changeCase.camelCase(str);
                    break;
                case "param":
                    retStr = changeCase.paramCase(str);
                    break;
                case "pascal":
                    retStr = changeCase.pascalCase(str);
                    break;
                case "none":
                    retStr = str;
                    break;
            }
            return retStr;
        });
        Handlebars.registerHelper("constantCase", str => changeCase.constantCase(str));
        Handlebars.registerHelper("tsTypeToString", obj => {
            if (typeof obj === "string") {
                return obj;
            } else {
                return toEntityName(obj.name);
            }
        });
        Handlebars.registerHelper("toPropertyName", str => {
            let retStr = "";

            if (this.Options.removeIdSuffix && str.length > 3 && str.endsWith("_id")) {
                str = str.substring(0, str.length - 3);
            }

            switch (this.Options.convertCaseProperty) {
                case "camel":
                    retStr = changeCase.camelCase(str);
                    break;
                case "pascal":
                    retStr = changeCase.pascalCase(str);
                    break;
                case "none":
                    retStr = str;
                    break;
            }
            return retStr;
        });
        Handlebars.registerHelper("toLowerCase", str => {
            return str.toLowerCase();
        });
        Handlebars.registerHelper("toLazy", str => {
            if (this.Options.lazy) return `Promise<${str}>`;
            else return str;
        });
        Handlebars.registerHelper({
            eq: function(v1, v2) {
                return v1 === v2;
            },
            ne: function(v1, v2) {
                return v1 !== v2;
            },
            lt: function(v1, v2) {
                return v1 < v2;
            },
            gt: function(v1, v2) {
                return v1 > v2;
            },
            lte: function(v1, v2) {
                return v1 <= v2;
            },
            gte: function(v1, v2) {
                return v1 >= v2;
            },
            and: function(v1, v2) {
                return v1 && v2;
            },
            or: function(v1, v2) {
                return v1 || v2;
            }
        });
    }

    //TODO:Move to mustache template file
    private createTsConfigFile(resultPath) {
        fs.writeFileSync(
            path.resolve(resultPath, "tsconfig.json"),
            `{"compilerOptions": {
        "lib": ["es5", "es6"],
        "target": "es6",
        "module": "commonjs",
        "moduleResolution": "node",
        "emitDecoratorMetadata": true,
        "experimentalDecorators": true,
        "sourceMap": true
    }}`,
            { encoding: "UTF-8", flag: "w" }
        );
    }
    private createTypeOrmConfig(resultPath) {
        if (this.Options.schemaName == "") {
            fs.writeFileSync(
                path.resolve(resultPath, "ormconfig.json"),
                `[
  {
    "name": "default",
    "type": "${this.Options.databaseType}",
    "host": "${this.Options.host}",
    "port": ${this.Options.port},
    "username": "${this.Options.user}",
    "password": "${this.Options.password}",
    "database": "${this.Options.databaseName}",
    "synchronize": false,
    "entities": [
      "entities/*.js"
    ]
  }
]`,
                { encoding: "UTF-8", flag: "w" }
            );
        } else {
            fs.writeFileSync(
                path.resolve(resultPath, "ormconfig.json"),
                `[
  {
    "name": "default",
    "type": "${this.Options.databaseType}",
    "host": "${this.Options.host}",
    "port": ${this.Options.port},
    "username": "${this.Options.user}",
    "password": "${this.Options.password}",
    "database": "${this.Options.databaseName}",
    "schema": "${this.Options.schemaName}",
    "synchronize": false,
    "entities": [
      "entities/*.js"
    ]
  }
]`,
                { encoding: "UTF-8", flag: "w" }
            );
        }
    }
}
export interface EngineOptions {
    host: string;
    port: number;
    databaseName: string;
    user: string;
    password: string;
    resultsPath: string;
    databaseType: string;
    schemaName: string;
    ssl: boolean;
    noConfigs: boolean;
    convertCaseFile: "pascal" | "param" | "camel" | "none";
    convertCaseEntity: "pascal" | "camel" | "none";
    convertCaseProperty: "pascal" | "camel" | "none";
    removeIdSuffix: boolean;
    lazy: boolean;
    constructor: boolean;
    namingStrategy: AbstractNamingStrategy;
    relationIds: boolean;
}

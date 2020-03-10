import changeCase = require("change-case");
import { AbstractNamingStrategy } from "./AbstractNamingStrategy";
import { EntityInfo } from "./models/EntityInfo";
import { RelationInfo } from "./models/RelationInfo";

export class NamingStrategy extends AbstractNamingStrategy {
    public relationName(
        columnOldName: string,
        relation: RelationInfo,
        dbModel: EntityInfo[]
    ): string {
        const isRelationToMany = relation.isOneToMany || relation.isManyToMany;
        const ownerEntity = dbModel.find(
            v => v.tsEntityName === relation.ownerTable
        )!;
        let columnName = changeCase.camelCase(columnOldName);
        columnName = /^(.+?)((?<!g)uid|(?<!u)id)?$/i.exec(columnName)![1];

        if (!isNaN(parseInt(columnName[columnName.length - 1], 10))) {
            columnName = columnName.substring(0, columnName.length - 1);
        }
        if (!isNaN(parseInt(columnName[columnName.length - 1], 10))) {
            columnName = columnName.substring(0, columnName.length - 1);
        }
        columnName += isRelationToMany ? "s" : "";

        if (
            relation.relationType !== "ManyToMany" &&
            columnOldName !== columnName
        ) {
            if (ownerEntity.Columns.some(v => v.tsName === columnName)) {
                columnName = columnName + "_";
                for (let i = 2; i <= ownerEntity.Columns.length; i++) {
                    columnName =
                        columnName.substring(
                            0,
                            columnName.length - i.toString().length
                        ) + i.toString();
                    if (
                        ownerEntity.Columns.every(
                            v =>
                                v.tsName !== columnName ||
                                columnName === columnOldName
                        )
                    ) {
                        break;
                    }
                }
            }
        }

        return columnName;
    }

    public entityName(entityName: string): string {
        return entityName;
    }

    public columnName(columnName: string): string {
        return columnName;
    }
}

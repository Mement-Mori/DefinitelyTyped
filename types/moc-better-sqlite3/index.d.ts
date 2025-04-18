import Integer = require("integer");

type VariableArgFunction = (...params: any[]) => any;
type ArgumentTypes<F extends VariableArgFunction> = F extends (...args: infer A) => any ? A : never;

declare namespace MocBetterSqlite3 {
    interface Statement<BindParameters extends any[]> {
        database: Database;
        source: string;
        reader: boolean;

        run(...params: BindParameters): Database.RunResult;
        get(...params: BindParameters): any;
        all(...params: BindParameters): any[];
        iterate(...params: BindParameters): IterableIterator<any>;
        pluck(toggleState?: boolean): this;
        expand(toggleState?: boolean): this;
        raw(toggleState?: boolean): this;
        bind(...params: BindParameters): this;
        columns(): ColumnDefinition[];
        safeIntegers(toggleState?: boolean): this;
    }

    interface ColumnDefinition {
        name: string;
        column: string | null;
        table: string | null;
        database: string | null;
        type: string | null;
    }

    interface Transaction<F extends VariableArgFunction> {
        (...params: ArgumentTypes<F>): ReturnType<F>;
        default(...params: ArgumentTypes<F>): ReturnType<F>;
        deferred(...params: ArgumentTypes<F>): ReturnType<F>;
        immediate(...params: ArgumentTypes<F>): ReturnType<F>;
        exclusive(...params: ArgumentTypes<F>): ReturnType<F>;
    }

    interface Database {
        memory: boolean;
        readonly: boolean;
        name: string;
        open: boolean;
        inTransaction: boolean;

        prepare<BindParameters extends any[] | {} = any[]>(
            source: string,
        ): BindParameters extends any[] ? Statement<BindParameters> : Statement<[BindParameters]>;
        transaction<F extends VariableArgFunction>(fn: F): Transaction<F>;
        exec(source: string): this;
        pragma(source: string, options?: Database.PragmaOptions): any;
        checkpoint(databaseName?: string): this;
        function(name: string, cb: (...params: any[]) => any): this;
        function(name: string, options: Database.RegistrationOptions, cb: (...params: any[]) => any): this;
        aggregate(name: string, options: Database.AggregateOptions): this;
        loadExtension(path: string): this;
        close(): this;
        defaultSafeIntegers(toggleState?: boolean): this;
        backup(destinationFile: string, options?: Database.BackupOptions): Promise<Database.BackupMetadata>;
    }

    interface DatabaseConstructor {
        new(filename: string, options?: Database.Options): Database;
        (filename: string, options?: Database.Options): Database;
        prototype: Database;

        Integer: typeof Integer;
        SqliteError: SqliteErrorType;
    }
}

declare class SqliteErrorClass implements Error {
    name: string;
    message: string;
    code: string;
    constructor(message: string, code: string);
}

type SqliteErrorType = typeof SqliteErrorClass;

declare namespace Database {
    interface RunResult {
        changes: number;
        lastInsertRowid: Integer.IntLike;
    }

    interface Options {
        memory?: boolean | undefined;
        readonly?: boolean | undefined;
        fileMustExist?: boolean | undefined;
        timeout?: number | undefined;
        verbose?: ((message?: any, ...additionalArgs: any[]) => void) | undefined;
    }

    interface PragmaOptions {
        simple?: boolean | undefined;
    }

    interface RegistrationOptions {
        varargs?: boolean | undefined;
        deterministic?: boolean | undefined;
        safeIntegers?: boolean | undefined;
    }

    interface AggregateOptions extends RegistrationOptions {
        start?: any;
        step: (total: any, next: any) => any;
        inverse?: ((total: any, dropped: any) => any) | undefined;
        result?: ((total: any) => any) | undefined;
    }

    interface BackupMetadata {
        totalPages: number;
        remainingPages: number;
    }
    interface BackupOptions {
        progress: (info: BackupMetadata) => number;
    }

    type Integer = typeof Integer;
    type SqliteError = SqliteErrorType;
    type Statement<BindParameters extends any[] | {} = any[]> = BindParameters extends any[]
        ? MocBetterSqlite3.Statement<BindParameters>
        : MocBetterSqlite3.Statement<[BindParameters]>;
    type ColumnDefinition = MocBetterSqlite3.ColumnDefinition;
    type Transaction = MocBetterSqlite3.Transaction<VariableArgFunction>;
    type Database = MocBetterSqlite3.Database;
}

declare const Database: MocBetterSqlite3.DatabaseConstructor;
export = Database;

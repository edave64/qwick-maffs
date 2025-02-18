declare const allUnits: ({
    name: string;
    si: boolean;
    from: {
        ft: number;
        m?: undefined;
    };
    alias?: undefined;
} | {
    name: string;
    from: {
        m: number;
        ft?: undefined;
    };
    alias: {
        yd: number;
        mi: number;
        in: number;
    };
    si?: undefined;
})[];
export default allUnits;
export declare const lookup: {
    [k: string]: {
        name: string;
        si: boolean;
        from: {
            ft: number;
            m?: undefined;
        };
        alias?: undefined;
    } | {
        name: string;
        from: {
            m: number;
            ft?: undefined;
        };
        alias: {
            yd: number;
            mi: number;
            in: number;
        };
        si?: undefined;
    };
};

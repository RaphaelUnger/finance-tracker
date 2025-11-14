// Lightweight, intentionally permissive navigation prop type used by screens.
// Keeps compile-time safety without depending on navigation package types.
export type NavProps = {
    navigation: {
        navigate: (name: string, params?: any) => void;
        addListener: (event: string, cb: () => void) => any;
    };
    route: { params?: any };
};

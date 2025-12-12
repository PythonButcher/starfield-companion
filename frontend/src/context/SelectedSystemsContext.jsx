import { createContext, useState, useContext } from "react";

const SelectedSystemsContext = createContext();

export const SelectedSystemsProvider = ({ children }) => {
    const [selectedSystem, setSelectedSystem] = useState(null);

    const selectSystem = (system) => {
        setSelectedSystem(system);
    };

    const clearSystem = () => {
        setSelectedSystem(null);
    };

    return (
        <SelectedSystemsContext.Provider
            value={{ selectedSystem, selectSystem, clearSystem }}
        >
            {children}
        </SelectedSystemsContext.Provider>
    );
};

export const useSelectedSystems = () => {
    const context = useContext(SelectedSystemsContext);
    if (!context) {
        throw new Error("useSelectedSystems must be used within SelectedSystemsProvider");
    }
    return context;
};

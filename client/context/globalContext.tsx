import React, { useContext, useState } from 'react';


interface InformationModal {
    type: string;
    text: string;
}

export type AuthModalState = 'signin' | 'signup' | 'none';

export interface GStatus {
    chatbotActive: boolean; // Chatbot window on/off
    activeContact: number | null; // Switch between contacts. Default: null
    informationModal: InformationModal | null;
    authModalActive: AuthModalState
}

const GStatusContext = React.createContext
    <{
        gStatus: GStatus;
        setGStatus: React.Dispatch<React.SetStateAction<GStatus>>;
        handleGStatus: (propertyName: keyof GStatus, newValue: any) => void;
    }>({
        gStatus: {
            chatbotActive: false,
            activeContact: null,
            informationModal: null,
            authModalActive: 'none'
        },
        setGStatus: () => { },
        handleGStatus: () => { }
    });

export const GStatusProvider: React.FC<{
    children: React.ReactNode
}> = ({ children }) => {
    const [gStatus, setGStatus] = useState<GStatus>({
        chatbotActive: false,
        activeContact: null,
        informationModal: null,
        authModalActive: 'none'
    });

    const handleGStatus = (propertyName: keyof GStatus, newValue: any) => {
        // Update the specific property with the new value
        setGStatus((prevGStatus) => ({
            ...prevGStatus,
            [propertyName]: newValue,
        }));
    };

    return (
        <GStatusContext.Provider value={{ gStatus, setGStatus, handleGStatus }}>
            {children}
        </GStatusContext.Provider>
    );
}

export const useGStatus = () => {
    return useContext(GStatusContext);
};

/*
export const handleGStatus = (setGStatus: React.Dispatch<React.SetStateAction<GStatus>>, propertyName: keyof GStatus, newValue: any) => {
    // Update the specific property with the new value
    // Needs set function because set can only be assigned inside component
    setGStatus((prevGStatus) => {
        return ({
            ...prevGStatus,
            [propertyName]: newValue,
        })
    });
};*/
import { Wrapper, Status } from "@googlemaps/react-wrapper";
import { ReactElement } from "react";

interface GoogleMapWrapperProps {
    children: ReactElement;
    apiKey: string;
}

const render = (status: Status): ReactElement => {
    switch (status) {
        case Status.LOADING:
            return (
                <div className="flex items-center justify-center h-full w-full">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">Loading Google Maps...</p>
                    </div>
                </div>
            );
        case Status.FAILURE:
            return (
                <div className="flex items-center justify-center h-full w-full">
                    <div className="text-center text-red-500">
                        <p className="font-bold">Failed to load Google Maps</p>
                        <p className="text-sm">Please check your API key and internet connection</p>
                    </div>
                </div>
            );
        case Status.SUCCESS:
            return <></>;
    }
};

export const GoogleMapWrapper = ({ children, apiKey }: GoogleMapWrapperProps) => {
    return (
        <Wrapper
            apiKey={apiKey}
            render={render}
            libraries={['drawing', 'visualization', 'places']}
        >
            {children}
        </Wrapper>
    );
};

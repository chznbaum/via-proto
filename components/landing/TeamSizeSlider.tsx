"use client";

import { Dispatch, SetStateAction } from "react";

interface TeamSizeSliderProps {
    teamSeats: number;
    setTeamSeats: Dispatch<SetStateAction<number>>;
    pricePerSeat: number;
}

export const TeamSizeSlider = ({ teamSeats, setTeamSeats, pricePerSeat }: TeamSizeSliderProps) => {
    return (
        <div className="mb-6">
            <label htmlFor="team-seats-slider" className="text-sm font-medium text-base-content mb-2 block">
                How many seats?
            </label>
            <input
                id="team-seats-slider"
                type="range"
                min="2"
                max="50"
                value={teamSeats}
                onChange={(e) => setTeamSeats(Number.parseInt(e.target.value))}
                className="range range-xs range-primary w-full"
            />
            <div className="flex justify-between gap-3 mt-2">
                <p className="text-sm text-base-content/80">
                    <span className="font-semibold text-base-content">{teamSeats}</span> Team Members
                </p>
                <p className="text-sm text-base-content/80">
                    <span className="font-semibold text-base-content">${teamSeats * pricePerSeat}/mo</span>
                </p>
            </div>
        </div>
    );
};

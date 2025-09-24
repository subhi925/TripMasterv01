import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import PlanMyTrip from "./PlanMyTrip";
import { useAuthState } from "react-firebase-hooks/auth";

// Mock Firebase user
jest.mock("react-firebase-hooks/auth", () => ({
  useAuthState: jest.fn(),
}));

describe("PlanMyTrip Simple Test", () => {
  beforeEach(() => {
    useAuthState.mockReturnValue([{ uid: "user123" }, false, null]);
  });

  test("address input is present and editable", () => {
    render(<PlanMyTrip />);
    
    // Find input by placeholder
    const addressInput = screen.getByPlaceholderText(/Enter your Destion/i);
    expect(addressInput).toBeInTheDocument();
    
    // Type in the input
    fireEvent.change(addressInput, { target: { value: "Haifa" } });
    expect(addressInput.value).toBe("Haifa");
  });
});

import { ConstraintInput, ConstraintResult } from "./constraint.types.js";
import { constraintRules } from "./constraint.rules.js";

export class ConstraintEngine {
    static validate(input: ConstraintInput): ConstraintResult {
        const rule = constraintRules[input.tripType];

        if (!rule) {
            return { allowed: false, reason: "Unsupported trip type" };
        }

        return rule(input);
    }
}

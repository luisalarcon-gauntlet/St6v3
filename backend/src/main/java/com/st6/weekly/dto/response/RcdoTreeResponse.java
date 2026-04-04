package com.st6.weekly.dto.response;

import com.st6.weekly.domain.rcdo.DefiningObjective;
import com.st6.weekly.domain.rcdo.Outcome;
import com.st6.weekly.domain.rcdo.RallyCry;

import java.util.List;
import java.util.UUID;

public record RcdoTreeResponse(
        UUID id,
        String title,
        String description,
        String status,
        int displayOrder,
        List<DefiningObjectiveNode> definingObjectives
) {
    public static RcdoTreeResponse from(RallyCry rc) {
        List<DefiningObjectiveNode> doNodes = rc.getDefiningObjectives() != null
                ? rc.getDefiningObjectives().stream()
                        .map(DefiningObjectiveNode::from)
                        .toList()
                : List.of();

        return new RcdoTreeResponse(
                rc.getId(),
                rc.getTitle(),
                rc.getDescription(),
                rc.getStatus(),
                rc.getDisplayOrder(),
                doNodes
        );
    }

    public record DefiningObjectiveNode(
            UUID id,
            String title,
            String description,
            String status,
            List<OutcomeNode> outcomes
    ) {
        public static DefiningObjectiveNode from(DefiningObjective doObj) {
            List<OutcomeNode> outcomeNodes = doObj.getOutcomes() != null
                    ? doObj.getOutcomes().stream()
                            .map(OutcomeNode::from)
                            .toList()
                    : List.of();

            return new DefiningObjectiveNode(
                    doObj.getId(),
                    doObj.getTitle(),
                    doObj.getDescription(),
                    doObj.getStatus(),
                    outcomeNodes
            );
        }
    }

    public record OutcomeNode(
            UUID id,
            String title,
            String description,
            String status
    ) {
        public static OutcomeNode from(Outcome outcome) {
            return new OutcomeNode(
                    outcome.getId(),
                    outcome.getTitle(),
                    outcome.getDescription(),
                    outcome.getStatus()
            );
        }
    }
}

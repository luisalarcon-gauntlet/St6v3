package com.st6.weekly.service;

import com.st6.weekly.domain.rcdo.DefiningObjective;
import com.st6.weekly.domain.rcdo.DefiningObjectiveRepository;
import com.st6.weekly.domain.rcdo.Outcome;
import com.st6.weekly.domain.rcdo.OutcomeRepository;
import com.st6.weekly.domain.rcdo.RallyCry;
import com.st6.weekly.domain.rcdo.RallyCryRepository;
import com.st6.weekly.exception.ResourceNotFoundException;
import com.st6.weekly.security.InputSanitizer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RcdoServiceTest {

    @Mock
    private RallyCryRepository rallyCryRepository;

    @Mock
    private DefiningObjectiveRepository definingObjectiveRepository;

    @Mock
    private OutcomeRepository outcomeRepository;

    @Mock
    private InputSanitizer inputSanitizer;

    @InjectMocks
    private RcdoService rcdoService;

    @BeforeEach
    void setUp() {
        lenient().when(inputSanitizer.sanitize(anyString())).thenAnswer(inv -> inv.getArgument(0));
    }

    // --- fetchFullTree ---

    @Test
    void fetchFullTree_returns_complete_hierarchy() {
        RallyCry rc = buildRallyCry("Accelerate Adoption", 1);
        DefiningObjective doObj = buildDefiningObjective(rc, "Reduce onboarding time");
        Outcome outcome = buildOutcome(doObj, "Self-serve onboarding flow");
        doObj.getOutcomes().add(outcome);
        rc.getDefiningObjectives().add(doObj);

        when(rallyCryRepository.fetchFullTree()).thenReturn(List.of(rc));

        List<RallyCry> tree = rcdoService.fetchFullTree();

        assertThat(tree).hasSize(1);
        assertThat(tree.get(0).getTitle()).isEqualTo("Accelerate Adoption");
        assertThat(tree.get(0).getDefiningObjectives()).hasSize(1);

        DefiningObjective firstDo = tree.get(0).getDefiningObjectives().iterator().next();
        assertThat(firstDo.getTitle()).isEqualTo("Reduce onboarding time");
        assertThat(firstDo.getOutcomes()).hasSize(1);
        assertThat(firstDo.getOutcomes().iterator().next().getTitle())
                .isEqualTo("Self-serve onboarding flow");

        verify(rallyCryRepository, times(1)).fetchFullTree();
    }

    @Test
    void fetchFullTree_excludes_archived_rally_cries() {
        RallyCry active = buildRallyCry("Active RC", 1);
        when(rallyCryRepository.fetchFullTree()).thenReturn(List.of(active));

        List<RallyCry> tree = rcdoService.fetchFullTree();

        assertThat(tree).hasSize(1);
        assertThat(tree.get(0).getTitle()).isEqualTo("Active RC");
        verify(rallyCryRepository).fetchFullTree();
        verifyNoMoreInteractions(rallyCryRepository);
    }

    @Test
    void fetchFullTree_returns_empty_when_no_active_rally_cries() {
        when(rallyCryRepository.fetchFullTree()).thenReturn(List.of());

        List<RallyCry> tree = rcdoService.fetchFullTree();

        assertThat(tree).isEmpty();
    }

    // --- createRallyCry ---

    @Test
    void createRallyCry_saves_and_returns_entity() {
        when(rallyCryRepository.save(any(RallyCry.class))).thenAnswer(inv -> {
            RallyCry rc = inv.getArgument(0);
            rc.setId(UUID.randomUUID());
            return rc;
        });

        RallyCry result = rcdoService.createRallyCry("New Rally Cry", "Description");

        assertThat(result.getTitle()).isEqualTo("New Rally Cry");
        assertThat(result.getDescription()).isEqualTo("Description");
        assertThat(result.getStatus()).isEqualTo("ACTIVE");
        assertThat(result.getId()).isNotNull();
        verify(rallyCryRepository).save(any(RallyCry.class));
    }

    @Test
    void createRallyCry_sanitizes_inputs() {
        when(inputSanitizer.sanitize("<script>alert('xss')</script>Title")).thenReturn("Title");
        when(inputSanitizer.sanitize("<b>Description</b>")).thenReturn("Description");
        when(rallyCryRepository.save(any(RallyCry.class))).thenAnswer(inv -> {
            RallyCry rc = inv.getArgument(0);
            rc.setId(UUID.randomUUID());
            return rc;
        });

        RallyCry result = rcdoService.createRallyCry("<script>alert('xss')</script>Title", "<b>Description</b>");

        assertThat(result.getTitle()).isEqualTo("Title");
        assertThat(result.getDescription()).isEqualTo("Description");
    }

    // --- createDefiningObjective ---

    @Test
    void createDefiningObjective_links_to_rally_cry() {
        RallyCry rc = buildRallyCry("Test RC", 1);
        rc.setId(UUID.randomUUID());
        when(rallyCryRepository.findById(rc.getId())).thenReturn(Optional.of(rc));
        when(definingObjectiveRepository.save(any(DefiningObjective.class))).thenAnswer(inv -> {
            DefiningObjective d = inv.getArgument(0);
            d.setId(UUID.randomUUID());
            return d;
        });

        DefiningObjective result = rcdoService.createDefiningObjective(rc.getId(), "New DO", "DO Desc");

        assertThat(result.getTitle()).isEqualTo("New DO");
        assertThat(result.getDescription()).isEqualTo("DO Desc");
        assertThat(result.getRallyCry()).isSameAs(rc);
        assertThat(result.getStatus()).isEqualTo("ACTIVE");
        assertThat(result.getId()).isNotNull();
    }

    @Test
    void createDefiningObjective_throws_when_rally_cry_not_found() {
        UUID badId = UUID.randomUUID();
        when(rallyCryRepository.findById(badId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> rcdoService.createDefiningObjective(badId, "DO", "Desc"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Rally Cry not found");
    }

    // --- createOutcome ---

    @Test
    void createOutcome_links_to_defining_objective() {
        RallyCry rc = buildRallyCry("Test RC", 1);
        rc.setId(UUID.randomUUID());
        DefiningObjective doObj = buildDefiningObjective(rc, "Test DO");
        doObj.setId(UUID.randomUUID());

        when(definingObjectiveRepository.findById(doObj.getId())).thenReturn(Optional.of(doObj));
        when(outcomeRepository.save(any(Outcome.class))).thenAnswer(inv -> {
            Outcome o = inv.getArgument(0);
            o.setId(UUID.randomUUID());
            return o;
        });

        Outcome result = rcdoService.createOutcome(doObj.getId(), "New Outcome", "Outcome Desc");

        assertThat(result.getTitle()).isEqualTo("New Outcome");
        assertThat(result.getDescription()).isEqualTo("Outcome Desc");
        assertThat(result.getDefiningObjective()).isSameAs(doObj);
        assertThat(result.getStatus()).isEqualTo("ACTIVE");
        assertThat(result.getId()).isNotNull();
    }

    @Test
    void createOutcome_throws_when_defining_objective_not_found() {
        UUID badId = UUID.randomUUID();
        when(definingObjectiveRepository.findById(badId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> rcdoService.createOutcome(badId, "Outcome", "Desc"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Defining Objective not found");
    }

    // --- Helpers ---

    private RallyCry buildRallyCry(String title, int order) {
        RallyCry rc = new RallyCry();
        rc.setId(UUID.randomUUID());
        rc.setTitle(title);
        rc.setDescription("Test description");
        rc.setStatus("ACTIVE");
        rc.setDisplayOrder(order);
        rc.setDefiningObjectives(new LinkedHashSet<>());
        return rc;
    }

    private DefiningObjective buildDefiningObjective(RallyCry rc, String title) {
        DefiningObjective doObj = new DefiningObjective();
        doObj.setId(UUID.randomUUID());
        doObj.setRallyCry(rc);
        doObj.setTitle(title);
        doObj.setDescription("Test DO description");
        doObj.setStatus("ACTIVE");
        doObj.setOutcomes(new LinkedHashSet<>());
        return doObj;
    }

    private Outcome buildOutcome(DefiningObjective doObj, String title) {
        Outcome outcome = new Outcome();
        outcome.setId(UUID.randomUUID());
        outcome.setDefiningObjective(doObj);
        outcome.setTitle(title);
        outcome.setDescription("Test outcome description");
        outcome.setStatus("ACTIVE");
        return outcome;
    }
}

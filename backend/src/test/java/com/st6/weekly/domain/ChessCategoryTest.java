package com.st6.weekly.domain;

import com.st6.weekly.domain.commit.ChessCategory;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ChessCategoryTest {

    @Test
    void all_six_categories_exist() {
        ChessCategory[] values = ChessCategory.values();
        assertThat(values).hasSize(6);
        assertThat(values).containsExactlyInAnyOrder(
                ChessCategory.KING,
                ChessCategory.QUEEN,
                ChessCategory.ROOK,
                ChessCategory.BISHOP,
                ChessCategory.KNIGHT,
                ChessCategory.PAWN
        );
    }

    @Test
    void king_is_limited_to_one_per_week() {
        assertThat(ChessCategory.KING.getMaxPerWeek()).isEqualTo(1);
    }

    @Test
    void other_categories_have_no_limit() {
        assertThat(ChessCategory.QUEEN.getMaxPerWeek()).isEqualTo(Integer.MAX_VALUE);
        assertThat(ChessCategory.ROOK.getMaxPerWeek()).isEqualTo(Integer.MAX_VALUE);
        assertThat(ChessCategory.BISHOP.getMaxPerWeek()).isEqualTo(Integer.MAX_VALUE);
        assertThat(ChessCategory.KNIGHT.getMaxPerWeek()).isEqualTo(Integer.MAX_VALUE);
        assertThat(ChessCategory.PAWN.getMaxPerWeek()).isEqualTo(Integer.MAX_VALUE);
    }
}

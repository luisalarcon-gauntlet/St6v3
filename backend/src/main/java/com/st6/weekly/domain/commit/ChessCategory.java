package com.st6.weekly.domain.commit;

public enum ChessCategory {
    KING(1),
    QUEEN(Integer.MAX_VALUE),
    ROOK(Integer.MAX_VALUE),
    BISHOP(Integer.MAX_VALUE),
    KNIGHT(Integer.MAX_VALUE),
    PAWN(Integer.MAX_VALUE);

    private final int maxPerWeek;

    ChessCategory(int maxPerWeek) {
        this.maxPerWeek = maxPerWeek;
    }

    public int getMaxPerWeek() {
        return maxPerWeek;
    }
}

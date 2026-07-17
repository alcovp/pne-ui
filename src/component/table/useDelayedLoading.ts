import {useEffect, useState} from 'react';

const DELAY_BEFORE_SHOWING = 300;
const MIN_DISPLAY_DURATION = 500;

type DelayedLoadingState = {
    resetKey?: string | number
    showSkeleton: boolean
    skeletonShownAt: number | null
    waitForStructuralLoading: boolean
}

const createLoadingState = (
    loading: boolean,
    resetKey?: string | number,
): DelayedLoadingState => ({
    resetKey,
    showSkeleton: loading,
    skeletonShownAt: loading ? Date.now() : null,
    waitForStructuralLoading: resetKey !== undefined && !loading,
})

/**
 * Хук стабилизации отображения состояния загрузки.
 *
 * Initial loading показывается сразу, чтобы таблица не рендерила пустую высоту до первого
 * skeleton. Последующие loading-состояния остаются отложенными, чтобы избежать мерцания
 * при быстрых refetch.
 */
const useDelayedLoading = (loading: boolean, resetKey?: string | number): boolean => {
    const [state, setState] = useState<DelayedLoadingState>(() => createLoadingState(loading, resetKey));
    let renderState = state;

    if (!Object.is(state.resetKey, resetKey)) {
        renderState = createLoadingState(loading, resetKey);
        setState(renderState);
    } else if (loading && state.waitForStructuralLoading) {
        renderState = {
            ...state,
            showSkeleton: true,
            skeletonShownAt: Date.now(),
            waitForStructuralLoading: false,
        };
        setState(renderState);
    }

    useEffect(() => {
        if (loading) {
            if (renderState.showSkeleton) {
                return undefined;
            }

            const timer = setTimeout(() => {
                setState(current => Object.is(current.resetKey, resetKey)
                    ? {
                        ...current,
                        showSkeleton: true,
                        skeletonShownAt: Date.now(),
                    }
                    : current);
            }, DELAY_BEFORE_SHOWING);

            return () => clearTimeout(timer);
        }

        if (renderState.skeletonShownAt) {
            const elapsed = Date.now() - renderState.skeletonShownAt;
            if (elapsed < MIN_DISPLAY_DURATION) {
                const timer = setTimeout(() => {
                    setState(current => Object.is(current.resetKey, resetKey)
                        ? {
                            ...current,
                            showSkeleton: false,
                            skeletonShownAt: null,
                        }
                        : current);
                }, MIN_DISPLAY_DURATION - elapsed);
                return () => clearTimeout(timer);
            }
        }

        if (renderState.showSkeleton) {
            setState(current => ({
                ...current,
                showSkeleton: false,
                skeletonShownAt: null,
            }));
        }
        return undefined;
    }, [loading, renderState.showSkeleton, renderState.skeletonShownAt, resetKey]);

    return renderState.showSkeleton;
};

export default useDelayedLoading;

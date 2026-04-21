import {useEffect, useRef, useState} from 'react';

const DELAY_BEFORE_SHOWING = 300;
const MIN_DISPLAY_DURATION = 500;

/**
 * Хук стабилизации отображения состояния загрузки.
 *
 * Initial loading показывается сразу, чтобы таблица не рендерила пустую высоту до первого
 * skeleton. Последующие loading-состояния остаются отложенными, чтобы избежать мерцания
 * при быстрых refetch.
 */
const useDelayedLoading = (loading: boolean): boolean => {
    const [showSkeleton, setShowSkeleton] = useState(loading);
    const isInitialLoadingRef = useRef(loading);
    const initialLoadingHandledRef = useRef(false);
    const skeletonShownAt = useRef<number | null>(loading ? Date.now() : null);

    useEffect(() => {
        if (loading) {
            if (isInitialLoadingRef.current && !initialLoadingHandledRef.current) {
                initialLoadingHandledRef.current = true;
                setShowSkeleton(true);
                skeletonShownAt.current = skeletonShownAt.current ?? Date.now();
                return undefined;
            }

            const timer = setTimeout(() => {
                setShowSkeleton(true);
                skeletonShownAt.current = Date.now();
            }, DELAY_BEFORE_SHOWING);

            return () => clearTimeout(timer);
        }

        initialLoadingHandledRef.current = true;

        if (skeletonShownAt.current) {
            const elapsed = Date.now() - skeletonShownAt.current;
            if (elapsed < MIN_DISPLAY_DURATION) {
                const timer = setTimeout(() => {
                    setShowSkeleton(false);
                    skeletonShownAt.current = null;
                }, MIN_DISPLAY_DURATION - elapsed);
                return () => clearTimeout(timer);
            }
        }

        setShowSkeleton(false);
        skeletonShownAt.current = null;
        return undefined;
    }, [loading]);

    return showSkeleton;
};

export default useDelayedLoading;

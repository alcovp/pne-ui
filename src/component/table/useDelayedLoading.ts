import {useEffect, useRef, useState} from 'react';

const DELAY_BEFORE_SHOWING = 300;
const MIN_DISPLAY_DURATION = 500;

/**
 * Хук задержки отображения состояния загрузки.
 *
 * Если загрузка завершается быстрее {@link DELAY_BEFORE_SHOWING} мс, индикатор не показывается вовсе.
 * Если индикатор был показан, он остаётся видимым минимум {@link MIN_DISPLAY_DURATION} мс,
 * чтобы избежать мерцания.
 */
const useDelayedLoading = (loading: boolean): boolean => {
    const [showSkeleton, setShowSkeleton] = useState(false);
    const skeletonShownAt = useRef<number | null>(null);

    useEffect(() => {
        if (loading) {
            const timer = setTimeout(() => {
                setShowSkeleton(true);
                skeletonShownAt.current = Date.now();
            }, DELAY_BEFORE_SHOWING);
            return () => clearTimeout(timer);
        }

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

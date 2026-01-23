import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

// Skeleton shimmer effect component
const SkeletonBox = ({ style }: { style?: any }) => {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmerAnim, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, []);

    const opacity = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <Animated.View
            style={[
                styles.skeleton,
                style,
                { opacity },
            ]}
        />
    );
};

// Event Card Skeleton
export const EventCardSkeleton = () => (
    <View style={styles.eventCard}>
        <SkeletonBox style={styles.eventImage} />
        <View style={styles.eventCardOverlay} />
        <View style={styles.eventCardContent}>
            <SkeletonBox style={styles.dateBadge} />
            <View style={styles.eventCardBottom}>
                <SkeletonBox style={styles.eventTitle} />
                <SkeletonBox style={styles.eventSubtitle} />
                <View style={styles.eventMeta}>
                    <SkeletonBox style={styles.metaItem} />
                    <SkeletonBox style={styles.metaItem} />
                </View>
            </View>
        </View>
    </View>
);

// Club Card Skeleton
export const ClubCardSkeleton = () => (
    <View style={styles.clubCard}>
        <SkeletonBox style={styles.clubImage} />
        <View style={styles.clubCardOverlay} />
        <View style={styles.clubCardContent}>
            <SkeletonBox style={styles.clubName} />
            <SkeletonBox style={styles.clubLocation} />
        </View>
    </View>
);

// Home Screen Loading Skeleton
export const HomeScreenSkeleton = () => (
    <View style={styles.container}>
        <EventCardSkeleton />
        <EventCardSkeleton />
        <EventCardSkeleton />
    </View>
);

// Clubs Screen Loading Skeleton
export const ClubsScreenSkeleton = () => (
    <View style={styles.container}>
        <ClubCardSkeleton />
        <ClubCardSkeleton />
        <ClubCardSkeleton />
        <ClubCardSkeleton />
    </View>
);

// Event List Item Skeleton (for ClubDetailScreen style)
const EventListItemSkeleton = () => (
    <View style={styles.eventListItem}>
        <SkeletonBox style={styles.eventListImage} />
        <View style={styles.eventListContent}>
            <SkeletonBox style={styles.eventListBadge} />
            <SkeletonBox style={styles.eventListTitle} />
            <View style={styles.eventListMeta}>
                <SkeletonBox style={styles.eventListMetaItem} />
                <SkeletonBox style={styles.eventListMetaItem} />
            </View>
            <SkeletonBox style={styles.eventListPrice} />
        </View>
    </View>
);

// Club Detail Events Loading Skeleton
export const ClubDetailEventsSkeleton = () => (
    <View style={styles.clubDetailContainer}>
        <EventListItemSkeleton />
        <EventListItemSkeleton />
        <EventListItemSkeleton />
    </View>
);

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    skeleton: {
        backgroundColor: 'rgba(80, 60, 100, 0.5)',
        borderRadius: 8,
    },
    eventCard: {
        height: 200,
        borderRadius: 20,
        marginBottom: 16,
        overflow: 'hidden',
        backgroundColor: 'rgba(60, 40, 80, 0.4)',
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.25)',
    },
    eventImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 20,
    },
    eventCardOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 20,
    },
    eventCardContent: {
        flex: 1,
        padding: 16,
        justifyContent: 'space-between',
    },
    dateBadge: {
        width: 80,
        height: 28,
        borderRadius: 14,
    },
    eventCardBottom: {
        gap: 8,
    },
    eventTitle: {
        width: '70%',
        height: 24,
        borderRadius: 6,
    },
    eventSubtitle: {
        width: '50%',
        height: 16,
        borderRadius: 4,
    },
    eventMeta: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 4,
    },
    metaItem: {
        width: 60,
        height: 14,
        borderRadius: 4,
    },
    clubCard: {
        height: 160,
        borderRadius: 20,
        marginBottom: 16,
        overflow: 'hidden',
        backgroundColor: 'rgba(60, 40, 80, 0.4)',
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.25)',
    },
    clubImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 20,
    },
    clubCardOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
    },
    clubCardContent: {
        flex: 1,
        padding: 20,
        justifyContent: 'flex-end',
        gap: 8,
    },
    clubName: {
        width: '60%',
        height: 24,
        borderRadius: 6,
    },
    clubLocation: {
        width: '40%',
        height: 16,
        borderRadius: 4,
    },
    // Club Detail Event List styles
    clubDetailContainer: {
        paddingHorizontal: 0,
    },
    eventListItem: {
        flexDirection: 'row',
        backgroundColor: 'rgba(60, 40, 80, 0.4)',
        borderRadius: 16,
        marginBottom: 12,
        overflow: 'hidden',
        height: 100,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.25)',
    },
    eventListImage: {
        width: 100,
        height: 100,
        borderRadius: 16,
    },
    eventListContent: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
    },
    eventListBadge: {
        width: 60,
        height: 20,
        borderRadius: 10,
    },
    eventListTitle: {
        width: '80%',
        height: 18,
        borderRadius: 4,
    },
    eventListMeta: {
        flexDirection: 'row',
        gap: 12,
    },
    eventListMetaItem: {
        width: 70,
        height: 14,
        borderRadius: 4,
    },
    eventListPrice: {
        width: 80,
        height: 16,
        borderRadius: 4,
    },
});

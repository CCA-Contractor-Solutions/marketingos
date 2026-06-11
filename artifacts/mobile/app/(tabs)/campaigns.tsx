import { Feather } from "@expo/vector-icons";
import {
  useListCampaigns,
  type CampaignSummary,
} from "@workspace/api-client-react";
import { router } from "expo-router";
import React from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  Avatar,
  Badge,
  Card,
  EmptyView,
  ErrorView,
  LoadingView,
  ProgressBar,
  ScreenTitle,
  resolveAccent,
  useBottomInset,
  useTopInset,
} from "@/components/ui";
import { useColors } from "@/hooks/useColors";
import { formatCurrency } from "@/lib/format";

export default function CampaignsScreen() {
  const colors = useColors();
  const topInset = useTopInset();
  const bottomInset = useBottomInset();
  const { data, isLoading, isError, refetch, isRefetching } = useListCampaigns();

  if (isLoading) return <LoadingView />;
  if (isError || !data) return <ErrorView onRetry={() => refetch()} />;

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      data={data}
      keyExtractor={(c) => c.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingTop: topInset + 12,
        paddingHorizontal: 16,
        paddingBottom: bottomInset,
      }}
      ListHeaderComponent={
        <ScreenTitle
          title="Campaigns"
          subtitle={`${data.length} active initiatives`}
        />
      }
      ListEmptyComponent={
        <EmptyView
          icon="layers"
          title="No campaigns yet"
          body="Campaigns you launch will show up here."
        />
      }
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
      }
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      renderItem={({ item }) => (
        <CampaignRow campaign={item} colors={colors} />
      )}
    />
  );
}

function CampaignRow({
  campaign,
  colors,
}: {
  campaign: CampaignSummary;
  colors: ReturnType<typeof useColors>;
}) {
  const accent = resolveAccent(campaign.statusColor);
  const spentPct = campaign.budgetTotal
    ? Math.round((campaign.budgetSpent / campaign.budgetTotal) * 100)
    : 0;
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push(`/campaign/${campaign.id}`)}
    >
      <Card>
        <View style={styles.top}>
          <Text
            style={[styles.name, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {campaign.name}
          </Text>
          <Badge label={campaign.status} accent={accent} />
        </View>

        <View style={styles.ownerRow}>
          <Avatar
            initials={initialsOf(campaign.owner)}
            accent={resolveAccent(campaign.ownerColor)}
            size={22}
          />
          <Text style={[styles.owner, { color: colors.mutedForeground }]}>
            {campaign.owner}
          </Text>
        </View>

        <View style={styles.channelRow}>
          {campaign.channels.slice(0, 4).map((ch) => (
            <View
              key={ch}
              style={[styles.channelChip, { backgroundColor: colors.muted }]}
            >
              <Text style={[styles.channelText, { color: colors.inkSoft }]}>
                {ch}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.progressRow}>
          <ProgressBar value={campaign.progress} accent={accent} />
          <Text style={[styles.pct, { color: colors.inkSoft }]}>
            {campaign.progress}%
          </Text>
        </View>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <View style={styles.footerItem}>
            <Feather name="dollar-sign" size={13} color={colors.mutedForeground} />
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
              {formatCurrency(campaign.budgetSpent)} /{" "}
              {formatCurrency(campaign.budgetTotal)}
            </Text>
          </View>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            {spentPct}% spent
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const styles = StyleSheet.create({
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  name: { fontFamily: "Inter_600SemiBold", fontSize: 16, flex: 1 },
  ownerRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  owner: { fontFamily: "Inter_400Regular", fontSize: 13 },
  channelRow: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 12 },
  channelChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  channelText: { fontFamily: "Inter_500Medium", fontSize: 11 },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
  },
  pct: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    width: 36,
    textAlign: "right",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    marginTop: 14,
    paddingTop: 12,
  },
  footerItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  footerText: { fontFamily: "Inter_400Regular", fontSize: 12 },
});

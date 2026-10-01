import { ActivityBoard } from "@/components/activities/activity-board";
import { PageHeader } from "@/components/page-header";
import { listActivities } from "@/lib/activities-server";
import { requireUser } from "@/lib/session";

export default async function ActivitiesPage() {
  const user = await requireUser("/activities");
  const activities = await listActivities(user.id);

  return (
    <>
      <PageHeader
        eyebrow="birlikte yapalım"
        title="Aktivitelerimiz"
        description="Beraber yapmak istediğimiz şeyler. Karar veremediğimizde şansımıza bırakalım."
      />
      <ActivityBoard activities={activities} />
    </>
  );
}

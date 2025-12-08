import GroupTree from "../components/GroupTree";
import {SnowBackground, SnowForeground} from "../components/Snow.jsx";

export default function DashboardPage({props}) {
    const roundId = "";
    const groupName = "";
    return (
            <>
            {/*Snow Effects*/}
          <SnowForeground />
          <SnowBackground />
        <GroupTree
              roundId={roundId}
              groupName={groupName}
        /></>
    )
}
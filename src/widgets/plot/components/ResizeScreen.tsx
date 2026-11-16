import LoaderInline from "@jetbrains/ring-ui-built/components/loader-inline/loader-inline.js"
import LoaderScreen from "@jetbrains/ring-ui-built/components/loader-screen/loader-screen.js";
import Text from "@jetbrains/ring-ui-built/components/text/text.js"

type ResizeScreenProps = {
    message: string;
};

const ResizeScreen = ({ message }: ResizeScreenProps) => {
    return (
        <LoaderScreen message={message} />
    )
}

export default ResizeScreen

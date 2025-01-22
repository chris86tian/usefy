import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"

interface InstructorProps {
  name: string
  expertise: string
  image: string
  bio: string
}

export default function InstructorCard({ name, expertise, image, bio }: InstructorProps) {
  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardContent className="p-6">
        <div className="flex flex-col items-center">
          <Image src={image || "/placeholder.svg"} alt={name} width={100} height={100} className="rounded-full mb-4" />
          <h3 className="text-xl font-semibold mb-2">{name}</h3>
          <p className="text-sm text-gray-500 mb-2">{expertise}</p>
          <p className="text-sm text-center">{bio}</p>
        </div>
      </CardContent>
    </Card>
  )
}


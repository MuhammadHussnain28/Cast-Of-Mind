import { motion, useReducedMotion } from 'framer-motion'
import { Heading, Text } from '../ui'
import { Envelope, Shield, Clock } from './ContactIcons'
import { channels } from '../../data/contactContent'

const ICONS = { envelope: Envelope, shield: Shield, clock: Clock }

export default function ContactChannels() {
  const reduceMotion = useReducedMotion()

  const reveal = (index) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 15 },
          animate: { opacity: 1, y: 0 },
          transition: {
            duration: 0.6,
            delay: 0.15 + index * 0.08,
            ease: [0.22, 1, 0.36, 1],
          },
        }

  return (
    <ul className="grid gap-3.5">
      {channels.map((channel, index) => {
        const IconComponent = ICONS[channel.icon]

        return (
          <motion.li
            key={channel.id}
            {...reveal(index)}
            className="group rounded-2xl bg-paper/5 border border-paper/10 p-5 transition-all duration-200 hover:bg-paper/10 hover:border-paper/20"
          >
            <div className="flex items-start gap-4">
              
              {/* Custom SVG Icon Plate */}
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-paper/10 border border-paper/10 text-sage group-hover:scale-105 transition-transform">
                <IconComponent className="h-5 w-5 text-sage" />
              </span>

              <div className="min-w-0 flex-1">
                <Heading level={3} size="subsection" tone="inverse" className="text-base text-paper font-medium">
                  {channel.title}
                </Heading>

                {channel.value ? (
                  <p className="mt-1">
                    {channel.href ? (
                      <a
                        href={channel.href}
                        className="font-body text-xs font-medium text-gold hover:underline underline-offset-4 transition-colors"
                      >
                        {channel.value}
                      </a>
                    ) : (
                      <span className="font-body text-xs font-medium text-paper/85">
                        {channel.value}
                      </span>
                    )}
                  </p>
                ) : (
                  <Text size="ui" className="mt-1 text-xs text-sage font-medium">
                    {channel.fallback}
                  </Text>
                )}

                <Text size="ui" className="mt-1.5 text-xs text-paper/60 leading-relaxed">
                  {channel.body}
                </Text>
              </div>
            </div>
          </motion.li>
        )
      })}
    </ul>
  )
}
